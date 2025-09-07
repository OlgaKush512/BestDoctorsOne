import {
  CalendarToday,
  LocalHospital,
  LocationOn,
  Psychology,
  Search as SearchIcon,
  Star,
  TrendingUp,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Fade,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
  Zoom,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import React, { useState } from "react";
import { searchDoctors } from "../services/api";
import type { SearchParams, SearchResults } from "../types";

interface SearchFormData {
  specialty: string;
  location: string;
  date: Dayjs | null;
  additionalRequirements: string;
}

interface Props {
  onSearchSuccess: (results: SearchResults, params: SearchParams) => void;
}

const PanelSearch: React.FC<Props> = ({ onSearchSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState<SearchFormData>({
    specialty: "",
    location: "",
    date: null,
    additionalRequirements: "",
  });

  const specialties = [
    "Endocrinologue",
    "Cardiologue",
    "Dermatologue",
    "Gynécologue",
    "Neurologue",
    "Psychiatre",
    "Ophtalmologue",
    "ORL",
    "Rhumatologue",
    "Gastro-entérologue",
    "Pneumologue",
    "Urologue",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.specialty || !formData.location || !formData.date) {
      setErrorMsg("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const searchParams: SearchParams = {
        specialty: formData.specialty,
        location: formData.location,
        date: formData.date.format("YYYY-MM-DD"),
        additionalRequirements: formData.additionalRequirements || undefined,
      };

      const results = await searchDoctors(searchParams);
      onSearchSuccess(results, searchParams);
    } catch (error: any) {
      console.error("Search error:", error);
      const message =
        error?.message || "Erreur lors de la recherche. Veuillez réessayer.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      {errorMsg && (
        <Snackbar
          open
          autoHideDuration={6000}
          onClose={() => setErrorMsg(null)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="error" onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        </Snackbar>
      )}

      {/* Stats top */}
      <Fade in timeout={500}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)",
                border: "1px solid rgba(76,175,80,0.2)",
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: "success.main",
                    mx: "auto",
                    mb: 1,
                    width: 40,
                    height: 40,
                  }}
                >
                  <LocalHospital />
                </Avatar>
                <Typography variant="h6" color="success.dark" fontWeight={600}>
                  12,000+
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Docteurs analysés
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
                border: "1px solid rgba(25,118,210,0.2)",
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    mx: "auto",
                    mb: 1,
                    width: 40,
                    height: 40,
                  }}
                >
                  <Psychology />
                </Avatar>
                <Typography variant="h6" color="primary.dark" fontWeight={600}>
                  50,000+
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avis analysés par IA
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)",
                border: "1px solid rgba(255,152,0,0.2)",
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: "warning.main",
                    mx: "auto",
                    mb: 1,
                    width: 40,
                    height: 40,
                  }}
                >
                  <TrendingUp />
                </Avatar>
                <Typography variant="h6" color="warning.dark" fontWeight={600}>
                  98%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Précision de matching
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Fade>

      {/* Main form */}
      <Zoom in timeout={700}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            background: "linear-gradient(135deg, #FFFFFF 0%, #F8FFFE 100%)",
            border: "1px solid rgba(46,125,50,0.1)",
            borderRadius: 3,
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: "linear-gradient(90deg, #2E7D32 0%, #1976D2 100%)",
            },
          }}
        >
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                mx: "auto",
                mb: 2,
                width: 56,
                height: 56,
              }}
            >
              <SearchIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{
                background: "linear-gradient(135deg, #2E7D32 0%, #1976D2 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 700,
              }}
            >
              Recherche Intelligente
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Notre IA analyse les avis Google pour vous recommander les
              meilleurs docteurs
            </Typography>
            <Divider sx={{ maxWidth: 200, mx: "auto" }} />
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Spécialité médicale</InputLabel>
                  <Select
                    value={formData.specialty}
                    label="Spécialité médicale"
                    onChange={(e) =>
                      setFormData({ ...formData, specialty: e.target.value })
                    }
                  >
                    {specialties.map((specialty) => (
                      <MenuItem key={specialty} value={specialty}>
                        {specialty}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Ville ou Code Postal"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="ex: Paris, Lyon, 75001..."
                  InputProps={{
                    startAdornment: (
                      <LocationOn sx={{ mr: 1, color: "action.active" }} />
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Date souhaitée"
                  value={formData.date}
                  onChange={(newValue: Dayjs | null) =>
                    setFormData({ ...formData, date: newValue })
                  }
                  minDate={dayjs()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      InputProps: {
                        startAdornment: (
                          <CalendarToday
                            sx={{ mr: 1, color: "action.active" }}
                          />
                        ),
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    height: "100%",
                    p: 2,
                    background:
                      "linear-gradient(135deg, #E8F5E8 0%, #F3E5F5 100%)",
                    borderRadius: 2,
                    border: "1px solid rgba(46,125,50,0.2)",
                  }}
                >
                  <Star sx={{ color: "warning.main", mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    <strong>Analyse IA</strong> des avis pour un matching
                    personnalisé
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Exigences spécifiques (optionnel)"
                  value={formData.additionalRequirements}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      additionalRequirements: e.target.value,
                    })
                  }
                  placeholder="ex: Docteur LGBT-friendly, parlant anglais, spécialisé en thérapie hormonale, disponible le soir..."
                  helperText="Plus vous êtes précis, plus notre IA pourra vous recommander le docteur idéal"
                  InputProps={{
                    startAdornment: (
                      <Psychology
                        sx={{
                          mr: 1,
                          color: "action.active",
                          alignSelf: "flex-start",
                          mt: 1,
                        }}
                      />
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{
                    mt: 1,
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 600,
                    background:
                      "linear-gradient(135deg, #2E7D32 0%, #1976D2 100%)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #1B5E20 0%, #0D47A1 100%)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 25px rgba(46,125,50,0.3)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress
                        size={22}
                        sx={{ mr: 2, color: "white" }}
                      />
                      Recherche en cours... (peut prendre 1-2 minutes)
                    </>
                  ) : (
                    <>
                      <SearchIcon sx={{ mr: 1.5 }} />
                      Trouver les Meilleurs Docteurs
                    </>
                  )}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Zoom>
    </Box>
  );
};

export default PanelSearch;
