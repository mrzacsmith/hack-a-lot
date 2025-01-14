const Reviews = () => {
  return (
    <div className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Reviews</h1>
        </div>

        <div className="flex-1 bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-6 py-4">
            <p className="text-gray-500">No reviews yet</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reviews 