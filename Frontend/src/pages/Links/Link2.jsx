const Link2 = () => {
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Link 2 Page</h1>
      <p className="mb-6">
        This page is accessible by Employee and Co-worker. Here you can access tools and resources specific to your role.
      </p>

      <ul className="mb-6 list-disc list-inside text-left max-w-md mx-auto">
        <li>Manage tasks and projects</li>
        <li>Collaborate with team members</li>
        <li>View internal reports and updates</li>
      </ul>

      <button
        className="px-6 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition-colors"
        onClick={() => alert("Welcome to Link 2!")}
      >
        Explore Features
      </button>
    </div>
  );
};

export default Link2;
