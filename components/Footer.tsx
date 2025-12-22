export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <p className="footer-brand">ATQ Hunter</p>
        <p className="footer-copyright">
          © {new Date().getFullYear()} All rights reserved
        </p>
      </div>
    </footer>
  );
}

