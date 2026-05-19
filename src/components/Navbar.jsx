import { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";

const Navbar = ({ darkMode, toggleTheme }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="relative flex flex-col items-center justify-center gap-4 mb-2 sm:mb-4 sm:flex-row">

      <button
        onClick={toggleTheme}
        className="
        sm:absolute sm:left-0
        w-11
        h-11
        sm:w-14
        sm:h-14
        rounded-full
        bg-white/20
        backdrop-blur-xl
        flex
        items-center
        justify-center
        text-white
        text-2xl
        sm:text-3xl
        "
      >
        {darkMode ? <FaMoon /> : <FaSun />}
      </button>

      <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
        Weather
      </h1>

      <div className="nav-auth-actions">
        {user ? (
          <>
            <Link
              to="/profile"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-profile-button"
              title={`Open ${user.email} profile`}
            >
              {user.email}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="nav-auth-link nav-auth-link-secondary"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-auth-link nav-auth-link-secondary"
            >
              Login
            </Link>
            <Link
              to="/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-auth-link nav-auth-link-primary"
            >
              Sign up
            </Link>
          </>
        )}
      </div>

    </div>
  );
};

export default Navbar;
