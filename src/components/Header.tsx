import { Link } from "@tanstack/react-router";
import { EarthIcon } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="mx-auto w-11/12 max-w-screen-2xl flex justify-between py-4">
        <h2 className="m-0 text-accent font-semibold tracking-tight w-full inline-flex items-center">
          <Link to="/" className="">
            Setplay
          </Link>
        </h2>

        <div className="w-full flex justify-end items-center gap-4">
          <a href="/login" className="inline-flex items-center text-copy-secondary">
            Login
          </a>
          <button className="inline-flex items-center py-2 px-3 rounded-md bg-accent text-black gap-2">
            <EarthIcon className="h-4 w-4" />
            <span>Slot Card</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
