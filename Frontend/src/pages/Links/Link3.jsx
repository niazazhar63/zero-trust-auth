const Link3 = () => {
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Link 3 Page</h1>
      <p className="mb-6">
        This page is accessible by Employees only. It contains sensitive or role-specific information and tools.
      </p>

      <ul className="mb-6 list-disc list-inside text-left max-w-md mx-auto">
        <li>Access internal reports and analytics</li>
        <li>Manage projects and tasks</li>
        <li>Update employee-specific settings</li>
      </ul>

      <button
        className="px-6 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition-colors"
        onClick={() => alert("Employee access granted!")}
      >
        Employee Dashboard
      </button>
    </div>
  );
};

export default Link3;
