export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 px-4 pt-10 pb-14 text-accent/80">
      <div className="page-wrap flex flex-col items-center justify-center gap-4 text-center">
        <p className="m-0 text-sm">&copy; {year} Luis Balbas. All rights reserved.</p>
      </div>
    </footer>
  );
}
