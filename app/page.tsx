import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, FileText, DollarSign, Zap, CheckCircle, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">B</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">BuildTrack-LGU</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Digitize Your LGU's Project Lifecycle
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            BuildTrack-LGU is a comprehensive governance platform that manages the entire journey of local government projects—from planning to completion. Built for transparency, accountability, and efficiency.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/projects">
              <Button size="lg">View Public Projects</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg">Login to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <FileText className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Project Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Submit proposals, feasibility studies, and documents for review and prioritization in the Annual Investment Program (AIP).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <DollarSign className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Budget Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track approved budgets, disbursements, and fund sources with complete visibility across all projects.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Procurement Automation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Publish bids, manage submissions, and award contracts with full audit trails and public transparency.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Real-Time Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track project progress with milestone management, contractor reports, and approval workflows.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Public Transparency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Citizens can view all projects on an interactive map, track status, budget, and contractor information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                9 distinct roles with tailored permissions for administrators, planners, councils, contractors, and the public.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h4 className="text-lg font-semibold text-foreground">Proposal Submission</h4>
                <p className="text-muted-foreground">Planners submit project proposals with feasibility studies and initial documentation.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h4 className="text-lg font-semibold text-foreground">LDC Review & Prioritization</h4>
                <p className="text-muted-foreground">Development Council reviews and prioritizes projects for inclusion in the Annual Investment Program (AIP).</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h4 className="text-lg font-semibold text-foreground">Budget Allocation</h4>
                <p className="text-muted-foreground">Budget Officer allocates approved budgets and assigns fund source codes to funded projects.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <h4 className="text-lg font-semibold text-foreground">Public Bidding</h4>
                <p className="text-muted-foreground">BAC posts public invitations to bid. Contractors submit bids and BAC selects the winning contractor.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">5</div>
              <div>
                <h4 className="text-lg font-semibold text-foreground">Project Implementation</h4>
                <p className="text-muted-foreground">Contractor implements the project while the Technical Inspector monitors progress, approves milestones, and updates.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">6</div>
              <div>
                <h4 className="text-lg font-semibold text-foreground">Public Portal & Transparency</h4>
                <p className="text-muted-foreground">Citizens view all projects on the public portal with real-time status, budget, progress photos, and contractor information.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* <footer className="border-t border-border bg-muted mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2025 BuildTrack-LGU. Promoting transparency and good governance in local government projects.</p>
        </div>
      </footer> */}
    </div>
  );
}
