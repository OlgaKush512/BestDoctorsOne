import { Routes, Route } from "react-router-dom";
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Chip,
  Stack,
} from "@mui/material";
import { LocalHospital, Search, Star, Psychology } from "@mui/icons-material";
import SearchPage from "./pages/SearchPage";
import ResultsPage from "./pages/ResultsPage";

function App() {
  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #F8FFFE 0%, #E8F5E8 50%, #F0F8FF 100%)",
      }}
    >
      {/* Header avec gradient et design moderne */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: "linear-gradient(135deg, #2E7D32 0%, #1976D2 100%)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            sx={{
              mr: 2,
              background: "rgba(255,255,255,0.1)",
              "&:hover": {
                background: "rgba(255,255,255,0.2)",
              },
            }}
          >
            <LocalHospital />
          </IconButton>

          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              fontSize: "1.5rem",
              background: "linear-gradient(45deg, #FFFFFF 30%, #E3F2FD 90%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            BestDoctor
          </Typography>

          <Stack direction="row" spacing={1}>
            <Chip
              icon={<Search />}
              label="Recherche IA"
              variant="outlined"
              size="small"
              sx={{
                color: "white",
                borderColor: "rgba(255,255,255,0.3)",
                "& .MuiChip-icon": { color: "white" },
              }}
            />
            <Chip
              icon={<Psychology />}
              label="Analyse Avancée"
              variant="outlined"
              size="small"
              sx={{
                color: "white",
                borderColor: "rgba(255,255,255,0.3)",
                "& .MuiChip-icon": { color: "white" },
              }}
            />
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Hero Section avec animation subtile */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, rgba(46,125,50,0.05) 0%, rgba(25,118,210,0.05) 100%)",
          py: 4,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center" sx={{ position: "relative", zIndex: 1 }}>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                background: "linear-gradient(135deg, #2E7D32 0%, #1976D2 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 800,
                mb: 2,
              }}
            >
              Trouvez le Meilleur Docteur en France
            </Typography>

            <Box sx={{ maxWidth: 600, mx: "auto" }}>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  lineHeight: 1.6,
                  fontWeight: 400,
                }}
              >
                Intelligence artificielle + Doctolib + Avis Google =
                <Box
                  component="span"
                  sx={{ color: "primary.main", fontWeight: 600 }}
                >
                  {" "}
                  La solution parfaite pour votre santé
                </Box>
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              sx={{ mt: 3 }}
            >
              <Chip
                icon={<Star />}
                label="Analyse IA des avis"
                color="primary"
                variant="filled"
              />
              <Chip
                icon={<LocalHospital />}
                label="Données Doctolib"
                color="secondary"
                variant="filled"
              />
              <Chip label="100% Gratuit" color="success" variant="filled" />
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </Container>

      {/* Footer avec style moderne */}
      <Box
        component="footer"
        sx={{
          mt: "auto",
          py: 3,
          background: "linear-gradient(135deg, #F5F5F5 0%, #E8F5E8 100%)",
          borderTop: "1px solid rgba(46,125,50,0.1)",
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ fontWeight: 500 }}
          >
            © 2024 BestDoctor - Trouvez les meilleurs professionnels de santé en
            France
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default App;
