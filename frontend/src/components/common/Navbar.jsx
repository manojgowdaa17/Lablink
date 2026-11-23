import React, { useState, useEffect } from 'react'
import { Menu, X, FlaskConical } from 'lucide-react'
import { Link } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Explore Resources', href: '#explore' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNavClick = (e, href) => {
    e.preventDefault()
    setMobileOpen(false)
    const target = document.querySelector(href)
    if (target) target.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-navy/95 backdrop-blur-md border-b border-navy-700 shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, '#home')}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-teal/20 border border-teal/40 flex items-center justify-center group-hover:bg-teal/30 transition-colors">
              <FlaskConical size={18} className="text-teal-300" />
            </div>
            <span className="text-xl font-bold text-cloud tracking-tight">
              Lab<span className="text-teal-300">Link</span>
            </span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-3 py-2 text-sm text-cloud/70 hover:text-teal-300 rounded-lg hover:bg-navy-800/60 transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm px-4 py-2">
              Student Login
            </Link>
            <Link to="/faculty/login" className="btn-secondary text-sm px-4 py-2">
              Faculty Login
            </Link>
            <Link to="/admin/login" className="text-sm text-amber hover:text-amber-300 font-medium transition-colors px-2">
              Admin Portal
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-cloud/70 hover:text-cloud hover:bg-navy-800 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-navy-800/98 backdrop-blur-md border-b border-navy-700 px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-3 py-2.5 text-sm text-cloud/70 hover:text-teal-300 rounded-lg hover:bg-navy-700 transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-navy-700">
            <Link to="/login" className="btn-secondary text-sm w-full text-center">Student Login</Link>
            <Link to="/faculty/login" className="btn-secondary text-sm w-full text-center">Faculty Login</Link>
            <Link to="/admin/login" className="text-sm text-amber hover:text-amber-300 font-medium transition-colors py-2 text-center block">
              Admin Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
