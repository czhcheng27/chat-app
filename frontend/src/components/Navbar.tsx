import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, Check } from "lucide-react";
import ProfilePage from "../pages/ProfilePage";
import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants/theme";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const openLogoutModal = (id: string) => {
    const modal = document.getElementById(id) as HTMLDialogElement;
    modal?.showModal();
  };

  return (
    <header
      className="border-b border-base-300 fixed w-full top-0 z-40 
    backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-all"
            >
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Chatty</h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className={`dropdown dropdown-hover dropdown-end block`}>
              <div tabIndex={0} className="btn btn-sm m-1">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Theme</span>
              </div>
              <div
                tabIndex={0}
                className="dropdown-content menu bg-base-200 text-base-content rounded-box h-[30.5rem] max-h-[calc(100vh-8.6rem)] overflow-y-auto border border-white/5 shadow-2xl outline-1 outline-black/5"
              >
                <ul className="menu">
                  <li className="menu-title text-xs">Theme</li>
                  {THEMES.map((t) => (
                    <li key={t}>
                      <button
                        onClick={() => setTheme(t)}
                        className="gap-3 px-2"
                      >
                        <div
                          data-theme={t}
                          className="min-w-4.5 bg-base-100 grid shrink-0 grid-cols-2 gap-0.5 rounded-md p-1 shadow-sm"
                        >
                          <div className="bg-base-content size-1 rounded-full"></div>
                          <div className="bg-primary size-1 rounded-full"></div>
                          <div className="bg-secondary size-1 rounded-full"></div>
                          <div className="bg-accent size-1 rounded-full"></div>
                        </div>
                        <div className="w-32 truncate">{t}</div>
                        {t === theme ? (
                          <Check
                            className="absolute right-1"
                            style={{ width: 16, height: 16 }}
                          />
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {authUser && (
              <div className="dropdown dropdown-hover dropdown-center relative overflow-visible mr-3">
                <div className="flex items-center gap-2">
                  <img
                    tabIndex={1}
                    src={authUser?.profilePic || "/avatar.png"}
                    alt={authUser?.fullName}
                    className="rounded-full object-cover w-10 h-10 cursor-pointer"
                  />
                  <div className="max-w-[12ch] truncate overflow-hidden whitespace-nowrap text-right block">
                    {authUser?.fullName.toLocaleUpperCase()}
                  </div>
                </div>
                <ul
                  tabIndex={1}
                  className="dropdown-content menu mt-0.5 bg-base-200 rounded-box z-1 w-full border-white/5 shadow-2xl"
                >
                  <li onClick={() => openLogoutModal("navbar_profile_modal")}>
                    <a className="pl-1">
                      <User className="size-4" />
                      Profile
                    </a>
                  </li>
                  <li onClick={() => openLogoutModal("navbar_logout_modal")}>
                    <a className="pl-1">
                      <LogOut className="size-4" />
                      Logout
                    </a>
                  </li>
                </ul>
              </div>
            )}

            {/* Profile Modal Content */}
            <dialog id="navbar_profile_modal" className="modal transition-none">
              <div className="modal-box p-8 max-w-3xl max-h-[80vh] overflow-y-auto">
                <ProfilePage />
              </div>
              <form method="dialog" className="modal-backdrop">
                <button>close</button>
              </form>
            </dialog>

            {/* Logout Modal Content */}
            <dialog id="navbar_logout_modal" className="modal transition-none">
              <div className="modal-box">
                <h3 className="font-bold text-lg">Logout!</h3>
                <p className="py-4">Are you sure to log out?</p>
                <div className="modal-action">
                  <form method="dialog">
                    <button className="btn btn-sm">Cancel</button>
                    <button
                      className="btn btn-sm btn-error ml-2"
                      onClick={logout}
                    >
                      Logout
                    </button>
                  </form>
                </div>
              </div>
              <form method="dialog" className="modal-backdrop">
                <button>close</button>
              </form>
            </dialog>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
