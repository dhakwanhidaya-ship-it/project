import { useState, useEffect } from "react";
import { PosterCard, Poster } from "./components/PosterCard";
import { PosterModal } from "./components/PosterModal";
import { UploadDialog } from "./components/UploadDialog";
import { AuthModal } from "./components/AuthModal";
import { Button } from "./components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Plus, Grid3x3, LayoutGrid, Loader2, LogIn, LogOut, Shield } from "lucide-react";
import { projectId, publicAnonKey } from "./utils/supabase/info";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// Admin email addresses
const ADMIN_EMAILS = ["dhakwanhidaya@gmail.com", "dhakwansidra26@gmail.com"];

export default function App() {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [selectedPoster, setSelectedPoster] = useState<Poster | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const categories = ["all", "Typography", "Modern Art", "Abstract", "Vintage", "Minimalist", "Illustration", "Photography"];

  // Check authentication status
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email || null;
      setUserEmail(email);
      setIsAdmin(email ? ADMIN_EMAILS.includes(email) : false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email || null;
      setUserEmail(email);
      setIsAdmin(email ? ADMIN_EMAILS.includes(email) : false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch posters from backend
  const fetchPosters = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3137d085/posters`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setPosters(result.posters);
      } else {
        console.error("Failed to fetch posters:", result.error);
      }
    } catch (error) {
      console.error("Error fetching posters:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete poster
  const handleDelete = async (posterId: string) => {
    if (!isAdmin) {
      alert("Only admins can delete posters");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3137d085/posters/${posterId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        // Refresh posters list
        fetchPosters();
      } else {
        console.error("Failed to delete poster:", result.error);
        alert("Failed to delete poster");
      }
    } catch (error) {
      console.error("Error deleting poster:", error);
      alert("Failed to delete poster");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAddPoster = () => {
    if (!isAdmin) {
      alert("Only admins can upload posters. Please sign in with an admin account.");
      setIsAuthModalOpen(true);
      return;
    }
    setIsUploadDialogOpen(true);
  };

  useEffect(() => {
    fetchPosters();
  }, []);

  const filteredPosters = selectedCategory === "all" 
    ? posters 
    : posters.filter(poster => poster.category === selectedCategory);

  const handlePosterClick = (poster: Poster) => {
    setSelectedPoster(poster);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1>My Creative Works</h1>
              <p className="text-gray-600 mt-1">A collection of my poster designs</p>
            </div>
            <div className="flex items-center gap-3">
              {userEmail && (
                <div className="flex items-center gap-2 text-sm">
                  {isAdmin && (
                    <span className="flex items-center gap-1 text-green-600">
                      <Shield className="h-4 w-4" />
                      Admin
                    </span>
                  )}
                  <span className="text-gray-600">{userEmail}</span>
                </div>
              )}
              
              {isAdmin && (
                <Button className="gap-2" onClick={handleAddPoster}>
                  <Plus className="h-4 w-4" />
                  Add Poster
                </Button>
              )}
              
              {userEmail ? (
                <Button variant="outline" onClick={handleSignOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setIsAuthModalOpen(true)} className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Admin Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-8 flex items-center justify-between">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList>
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category === "all" ? "All" : category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* Poster Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPosters.map((poster) => (
              <PosterCard
                key={poster.id}
                poster={poster}
                onClick={() => handlePosterClick(poster)}
                onDelete={isAdmin ? handleDelete : () => {}}
                showDelete={isAdmin}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredPosters.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500 mb-4">No posters found in this category.</p>
            {isAdmin && (
              <Button onClick={handleAddPoster}>
                <Plus className="mr-2 h-4 w-4" />
                Upload Your First Poster
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Poster Detail Modal */}
      <PosterModal
        poster={selectedPoster}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Upload Dialog */}
      <UploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUploadSuccess={fetchPosters}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={() => {
          setIsAuthModalOpen(false);
          fetchPosters();
        }}
      />
    </div>
  );
}