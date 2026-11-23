import React from 'react'
import { FlaskConical, Mail, MapPin, Phone, Github, Twitter, Linkedin } from 'lucide-react'

const COLUMNS = [
  {
    heading: 'Platform',
    links: ['Explore Equipment', 'Book a Lab', 'AI Matching', 'FairShare Allocation', 'Analytics Dashboard'],
  },
  {
    heading: 'For Students',
    links: ['Getting Started', 'Submit a Request', 'Track Bookings', 'QR Check-In', 'Support & FAQ'],
  },
  {
    heading: 'Departments',
    links: ['CS & AI Lab', 'Electronics Lab', 'Robotics Lab', 'Life Sciences Lab', 'Design & Fab Lab'],
  },
]

export default function Footer() {
  const year = new Date().getFullYear()

  const handleNavClick = (e, href) => {
    e.preventDefault()
    const target = document.querySelector(href)
    if (target) target.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="bg-navy-800 border-t border-navy-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a
              href="#home"
              onClick={(e) => handleNavClick(e, '#home')}
              className="flex items-center gap-2 group mb-4"
            >
              <div className="w-9 h-9 rounded-lg bg-teal/20 border border-teal/40 flex items-center justify-center">
                <FlaskConical size={20} className="text-teal-300" />
              </div>
              <span className="text-2xl font-bold text-cloud tracking-tight">
                Lab<span className="text-teal-300">Link</span>
              </span>
            </a>
            <p className="text-cloud/50 text-sm leading-relaxed max-w-xs mb-6">
              Every Lab. Every Resource. One Connected Campus.
            </p>
            <div className="flex flex-col gap-3 text-sm text-cloud/50">
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-teal/60 shrink-0" />
                <span>support@lablink.campus</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-teal/60 shrink-0" />
                <span>+1 (555) 012-3456</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-teal/60 shrink-0" />
                <span>University Campus, Building A, Room 101</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              {[
                { icon: Github, label: 'GitHub' },
                { icon: Twitter, label: 'Twitter' },
                { icon: Linkedin, label: 'LinkedIn' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-navy-700 border border-navy-600 flex items-center justify-center text-cloud/40 hover:text-teal-300 hover:border-teal/40 transition-all duration-200"
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-sm font-semibold text-cloud mb-4 uppercase tracking-widest">
                {col.heading}
              </h4>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-cloud/50 hover:text-teal-300 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-navy-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-cloud/30">
            © {year} LabLink. All rights reserved. Built for campus research communities.
          </p>
          <div className="flex items-center gap-4 text-xs text-cloud/30">
            <a href="#" className="hover:text-teal-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-teal-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-teal-300 transition-colors">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
