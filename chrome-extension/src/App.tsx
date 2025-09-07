import { LocalHospital, Psychology, Search, Star } from "@mui/icons-material";
import {
  AppBar,
  Box,
  Chip,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import PanelResults from "./pages/PanelResults";
import PanelSearch from "./pages/PanelSearch";
import type { SearchParams, SearchResults } from "./types";

type View = "search" | "results";

const App: React.FC = () => {
  const [view, setView] = useState<View>("search");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(
    null
  );

  const handleSearchSuccess = (res: SearchResults, params: SearchParams) => {
    setResults(res);
    setLastSearchParams(params);
    setView("results");
  };

  const handleNewSearch = () => {
    setView("search");
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #F8FFFE 0%, #E8F5E8 50%, #F0F8FF 100%)",
      }}
    >
      <AppBar
        position="sticky"
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
              fontSize: "1.25rem",
              background: "linear-gradient(45deg, #FFFFFF 30%, #E3F2FD 90%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            BestDoctor
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            sx={{ display: { xs: "none", sm: "flex" } }}
          >
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
            <Chip
              icon={<Star />}
              label="100% Gratuit"
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

      <Container maxWidth={false} sx={{ p: 2 }}>
        {view === "search" && (
          <PanelSearch onSearchSuccess={handleSearchSuccess} />
        )}
        {view === "results" && results && lastSearchParams && (
          <PanelResults
            results={results}
            searchParams={lastSearchParams}
            onNewSearch={handleNewSearch}
          />
        )}
      </Container>
    </Box>
  );
};

export default App;
