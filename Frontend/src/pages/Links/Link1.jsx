const Link1 = () => {
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Link 1 Page</h1>
      <p className="mb-6">
        This page is accessible for all roles. Here you can find general information and features that everyone can use.
      </p>

      <ul className="mb-6 list-disc list-inside text-left max-w-md mx-auto">
        <li>View general content</li>
        <li>Access basic tools and resources</li>
        <li>Stay updated with announcements</li>
      </ul>

      <button
        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors"
        onClick={() => alert("Button clicked!")}
      >
        Click Me
      </button>
    </div>
  );
};

export default Link1;
