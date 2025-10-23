import { useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user, logOut } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logOut()
      .then(() => toast.success("Logged out successfully"))
      .catch(() => toast.error("Logout failed"));
  };

  // 🔹 Role-based navigation
  const handleAccess = (linkNumber, path) => {
    if (!user?.role) {
      toast.error("Please log in to access links");
      return;
    }

    const role = user.role;

    if (
      (linkNumber === 1) || 
      (linkNumber === 2 && (role === "employee" || role === "co-worker")) || 
      (linkNumber === 3 && role === "employee")
    ) {
      toast.success(`Access granted to Link ${linkNumber}`);
      navigate(path); // Navigate to the actual page
    } else {
      if (linkNumber === 2) toast.error("Only employees and co-workers can access Link 2");
      if (linkNumber === 3) toast.error("Only employees can access Link 3");
    }
  };

  const links = (
    <>
      <NavLink className="mr-2" to="/">Home</NavLink>
      <button onClick={() => handleAccess(1, "/link1")} className="mr-2">Link 1</button>
      <button onClick={() => handleAccess(2, "/link2")} className="mr-2">Link 2</button>
      <button onClick={() => handleAccess(3, "/link3")} className="mr-2">Link 3</button>
    </>
  );

  return (
    <div className="navbar">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
            {links}
          </ul>
        </div>
        <Link to="/" className="btn btn-ghost text-base sm:text-xl">Authentication APP</Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">{links}</ul>
      </div>

      <div className="navbar-end flex gap-5">
        {user?.email ? (
          <div className="dropdown dropdown-hover dropdown-end">
            <div tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img
                  alt="User Avatar"
                  src={user.photoURL || "https://static.vecteezy.com/system/resources/previews/032/176/191/non_2x/business-avatar-profile-black-icon-man-of-user-symbol-in-trendy-flat-style-isolated-on-male-profile-people-diverse-face-for-social-network-or-web-vector.jpg"}
                />
              </div>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-[-2] w-52 p-2 shadow">
              <p className="text-center py-2 flex justify-center items-center">
                {user.displayName || user.name || user.email.split("@")[0]}
                {user.emailVerified && <img className="h-5 w-5 ml-2" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWPaTlWqQ-UigcmguBbCorE4U1p6a3AfeWRQ&s" alt="verified" />}
              </p>
              <p className="text-center text-sm text-gray-500">
                Role: <span className="font-semibold">{user.role}</span>
              </p>
              <button onClick={handleLogout} className="text-sm cursor-pointer bg-blue-500 text-white px-10 py-2.5 mt-2">
                Log out
              </button>
            </ul>
          </div>
        ) : (
          <Link to="/login" className="text-sm cursor-pointer bg-blue-500 text-white px-10 py-2.5">Login</Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;
