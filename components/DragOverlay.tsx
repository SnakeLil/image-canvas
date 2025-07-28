export const DragOverlay = () => {
  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border-4 border-dashed border-blue-400 p-16 max-w-2xl mx-4 text-center shadow-2xl">
        {/* Corner decorations */}
        <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg"></div>

        <div className="text-4xl font-bold text-gray-800 mb-4">
          Drop image anywhere
        </div>
        <div className="text-lg text-gray-600 mb-8">
          Upload single or multiple images to get started
        </div>

        {/* File icons */}
        <div className="flex justify-center space-x-4 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg border border-blue-200">
            <div className="w-8 h-8 bg-blue-500 rounded-sm flex items-center justify-center">
              <div className="text-white text-xs font-bold">IMG</div>
            </div>
          </div>
          <div className="bg-green-100 p-3 rounded-lg border border-green-200">
            <div className="w-8 h-8 bg-green-500 rounded-sm flex items-center justify-center">
              <div className="text-white text-xs font-bold">PNG</div>
            </div>
          </div>
          <div className="bg-purple-100 p-3 rounded-lg border border-purple-200">
            <div className="w-8 h-8 bg-purple-500 rounded-sm flex items-center justify-center">
              <div className="text-white text-xs font-bold">JPG</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
