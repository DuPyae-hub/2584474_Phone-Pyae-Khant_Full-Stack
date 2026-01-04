import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConfetti } from "@/hooks/useConfetti";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  User, 
  Phone,
  Sparkles,
  Loader2,
  Trophy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const navigate = useNavigate();
  const { user, signUp, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { fireConfetti, fireEmoji } = useConfetti();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    gender: "",
    dob: "",
    level: "beginner",
  });

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(formData.email, formData.password, {
      name: formData.name,
      phone: formData.phone,
      gender: formData.gender,
      date_of_birth: formData.dob,
      level: formData.level,
    });

    if (error) {
      let message = error.message;
      if (message.includes("already registered")) {
        message = "This email is already registered. Please sign in instead.";
      }
      toast({
        title: "Registration Failed",
        description: message,
        variant: "destructive",
      });
      setLoading(false);
    } else {
      // Fire celebration confetti!
      fireConfetti("celebration");
      setTimeout(() => fireEmoji("🏸"), 300);
      
      toast({
        title: "🎉 Account Created!",
        description: "Welcome to ShuttleMatch! Your 3-month free trial has started.",
      });
      
      // Delay navigation to let user see confetti
      setTimeout(() => navigate("/"), 1500);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card variant="glass" className="overflow-hidden">
              <div className="h-2 gradient-primary" />
              
              <CardHeader className="text-center pb-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-sm mb-4 mx-auto">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>3-Month Free Trial</span>
                </div>
                <CardTitle className="text-2xl">Create Account</CardTitle>
                <CardDescription>
                  Join Mandalay's #1 badminton community
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+95 9 xxx xxx xxx"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select value={formData.gender} onValueChange={(v) => updateField('gender', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <div className="relative">
                        <Input
                          id="dob"
                          type="date"
                          value={formData.dob}
                          onChange={(e) => updateField('dob', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Skill Level</Label>
                    <Select value={formData.level} onValueChange={(v) => updateField('level', v)}>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-primary" />
                          <SelectValue placeholder="Select your level" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span>Beginner</span>
                            <span className="text-muted-foreground text-xs">(0-500 XP)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="intermediate">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span>Intermediate</span>
                            <span className="text-muted-foreground text-xs">(501-1500 XP)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="advanced">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-accent" />
                            <span>Advanced</span>
                            <span className="text-muted-foreground text-xs">(1501+ XP)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Select based on your current skill. You can level up by winning matches!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox id="terms" className="mt-1" required />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                      I agree to the{" "}
                      <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                      {" "}and{" "}
                      <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    </Label>
                  </div>

                  <Button variant="hero" size="lg" className="w-full" disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="glass rounded-xl p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Your free trial includes:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-accent">✓</span> Full access to partner matching
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent">✓</span> Tournament participation
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent">✓</span> Community chat rooms
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent">✓</span> Court booking assistance
                    </li>
                  </ul>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}