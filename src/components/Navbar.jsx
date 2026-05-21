import { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";

const Navbar = ({ darkMode, toggleTheme, leftAccessory }) => {
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="navbar__inner">
        <div className="navbar__left-actions">
          {leftAccessory}
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="navbar__theme-btn"
            aria-label="Toggle theme"
          >
            <span className="navbar__theme-icon">
              {darkMode ? <FaMoon /> : <FaSun />}
            </span>
          </button>
        </div>

        {/* Logo */}
        <div className="navbar__logo">
          <span className="navbar__logo-text">Weather</span>
        </div>

        {/* Auth actions */}
        <div className="navbar__actions">
          {user ? (
            <>
              <Link
                to="/profile"
                target="_blank"
                rel="noopener noreferrer"
                className="navbar__user-pill"
                title={`Open ${user.email} profile`}
              >
                <span className="navbar__user-avatar">
                  {user.email?.[0]?.toUpperCase()}
                </span>
                <span className="navbar__user-email">{user.email}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="navbar__btn navbar__btn--ghost"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" target="_blank" rel="noopener noreferrer" className="navbar__btn navbar__btn--ghost">
                Login
              </Link>
              <Link to="/signup" target="_blank" rel="noopener noreferrer" className="navbar__btn navbar__btn--primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
