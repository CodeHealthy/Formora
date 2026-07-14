import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import {
  useLogoutMutation,
  useSessionQuery,
} from "../../features/authentication/model/auth-queries";

const navigationItems = [
  { label: "Overview", to: "/" },
  { label: "Forms", to: "/forms" },
] as const;

export function ApplicationLayout() {
  const navigate = useNavigate();
  const session = useSessionQuery();
  const logout = useLogoutMutation();

  const handleLogout = async (): Promise<void> => {
    await logout.mutateAsync();
    await navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-content">
          <Link className="brand" to="/" aria-label="Formora home">
            Formora
          </Link>
          <nav aria-label="Primary navigation">
            <ul className="navigation-list">
              {navigationItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    className={({ isActive }) =>
                      isActive ? "navigation-link active" : "navigation-link"
                    }
                    end={item.to === "/"}
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="account-menu">
            <span>{session.data?.data.user.displayName}</span>
            <button type="button" onClick={() => void handleLogout()} disabled={logout.isPending}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}
