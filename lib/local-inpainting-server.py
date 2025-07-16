#!/usr/bin/env python3
"""
Local Inpainting Server
A simple FastAPI server for running Stable Diffusion inpainting locally.

Requirements:
pip install fastapi uvicorn torch torchvision diffusers pillow python-multipart

Usage:
python local-inpainting-server.py

Then configure your app to use: http://localhost:8000
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import torch
from diffusers import StableDiffusionInpaintPipeline
from PIL import Image
import io
import base64
import uvicorn
import os

app = FastAPI(title="Local Inpainting API", version="1.0.0")

# Enable CORS for web requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global pipeline variable
pipeline = None

def load_pipeline():
    """Load the Stable Diffusion inpainting pipeline"""
    global pipeline
    if pipeline is None:
        print("Loading Stable Diffusion Inpainting pipeline...")
        model_id = "runwayml/stable-diffusion-inpainting"
        
        # Use GPU if available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        torch_dtype = torch.float16 if device == "cuda" else torch.float32
        
        pipeline = StableDiffusionInpaintPipeline.from_pretrained(
            model_id,
            torch_dtype=torch_dtype,
            safety_checker=None,
            requires_safety_checker=False
        )
        pipeline = pipeline.to(device)
        
        # Enable memory efficient attention if available
        if hasattr(pipeline, "enable_attention_slicing"):
            pipeline.enable_attention_slicing()
        
        print(f"Pipeline loaded on {device}")
    
    return pipeline

@app.on_event("startup")
async def startup_event():
    """Load the model on startup"""
    load_pipeline()

@app.get("/")
async def root():
    return {"message": "Local Inpainting API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": pipeline is not None}

@app.post("/inpaint")
async def inpaint_image(
    image: UploadFile = File(...),
    mask: UploadFile = File(...),
    prompt: str = Form("high quality, photorealistic, detailed"),
    num_inference_steps: int = Form(20),
    guidance_scale: float = Form(7.5)
):
    """
    Inpaint an image using the provided mask
    
    Args:
        image: Original image file
        mask: Mask image (black areas will be inpainted)
        prompt: Text prompt for inpainting
        num_inference_steps: Number of denoising steps
        guidance_scale: Guidance scale for generation
    """
    try:
        # Load the pipeline
        pipe = load_pipeline()
        
        # Read and process images
        image_bytes = await image.read()
        mask_bytes = await mask.read()
        
        # Convert to PIL Images
        original_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        mask_image = Image.open(io.BytesIO(mask_bytes)).convert("RGB")
        
        # Resize images to be compatible with the model (512x512 or multiples of 64)
        def resize_to_model_size(img):
            w, h = img.size
            # Resize to fit within 512x512 while maintaining aspect ratio
            max_size = 512
            if w > h:
                new_w = min(w, max_size)
                new_h = int(h * new_w / w)
            else:
                new_h = min(h, max_size)
                new_w = int(w * new_h / h)
            
            # Make dimensions multiples of 64
            new_w = (new_w // 64) * 64
            new_h = (new_h // 64) * 64
            
            return img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        original_image = resize_to_model_size(original_image)
        mask_image = resize_to_model_size(mask_image)
        
        # Generate the inpainted image
        with torch.autocast("cuda" if torch.cuda.is_available() else "cpu"):
            result = pipe(
                prompt=prompt,
                image=original_image,
                mask_image=mask_image,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                height=original_image.height,
                width=original_image.width
            )
        
        # Convert result to base64
        output_image = result.images[0]
        buffer = io.BytesIO()
        output_image.save(buffer, format="PNG")
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return JSONResponse({
            "success": True,
            "image_url": f"data:image/png;base64,{img_base64}",
            "message": "Image processed successfully"
        })
        
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

if __name__ == "__main__":
    print("Starting Local Inpainting Server...")
    print("Make sure you have the required dependencies installed:")
    print("pip install fastapi uvicorn torch torchvision diffusers pillow python-multipart")
    print("\nServer will be available at: http://localhost:8000")
    print("API documentation at: http://localhost:8000/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)