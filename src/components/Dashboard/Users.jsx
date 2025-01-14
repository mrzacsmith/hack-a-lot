const Users = () => {
  return (
    <div className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Add User
          </button>
        </div>

        <div className="flex-1 bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {[1, 2, 3].map((item) => (
              <li key={item} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-200" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">User {item}</div>
                      <div className="text-sm text-gray-500">user{item}@example.com</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900">
                      Edit
                    </button>
                    <button className="px-3 py-1 text-sm text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Users 