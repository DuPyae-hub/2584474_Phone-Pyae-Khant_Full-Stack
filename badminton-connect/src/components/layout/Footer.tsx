import { Link } from "react-router-dom";
import { MapPin, Mail, Phone, Facebook, Instagram, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-xl">🏸</span>
              </div>
              <span className="font-display font-bold text-xl">
                Shuttle<span className="text-primary">Match</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Connect with badminton players in Mandalay. Find partners, join tournaments, and shop for quality equipment.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/partners" className="hover:text-primary transition-colors">Find Partners</Link></li>
              <li><Link to="/courts" className="hover:text-primary transition-colors">Court Directory</Link></li>
              <li><Link to="/rankings" className="hover:text-primary transition-colors">Rankings</Link></li>
              <li><Link to="/shop" className="hover:text-primary transition-colors">Shop</Link></li>
              <li><Link to="/community" className="hover:text-primary transition-colors">Community</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link to="/rules" className="hover:text-primary transition-colors">Game Rules</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Membership</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>73rd Street, Chan Aye Tharzan Township, Mandalay</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span>+95 9 123 456 789</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>hello@shuttlematch.mm</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2024 ShuttleMatch. All rights reserved. Made with ❤️ in Mandalay</p>
        </div>
      </div>
    </footer>
  );
}
