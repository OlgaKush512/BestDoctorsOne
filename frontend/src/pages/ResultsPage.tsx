import React from "react";
import { useLocation } from "react-router-dom";
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Rating,
  Box,
  Button,
  Divider,
} from "@mui/material";
import { Phone, LocationOn, Schedule, Star } from "@mui/icons-material";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
  aiAnalysis: {
    score: number;
    summary: string;
    pros: string[];
    cons: string[];
    lgbtFriendly?: boolean;
    languages?: string[];
  };
  availability: string[];
  doctolibUrl: string;
}

interface SearchResults {
  doctors: Doctor[];
  totalFound: number;
}

const ResultsPage: React.FC = () => {
  const location = useLocation();
  const { results, searchParams } = location.state as {
    results: SearchResults;
    searchParams: any;
  };

  if (!results || !results.doctors) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6">Aucun résultat trouvé</Typography>
        <Button href="/" sx={{ mt: 2 }}>
          Nouvelle recherche
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Résultats de recherche
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {results.totalFound} docteurs trouvés pour{" "}
          <strong>{searchParams.specialty}</strong> à{" "}
          <strong>{searchParams.location}</strong>
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {results.doctors.map((doctor) => (
          <Grid item xs={12} key={doctor.id}>
            <Card elevation={2}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Dr. {doctor.name}
                    </Typography>

                    <Typography
                      variant="subtitle1"
                      color="primary"
                      gutterBottom
                    >
                      {doctor.specialty}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                      <Typography variant="body2">{doctor.address}</Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Phone sx={{ mr: 1, color: "text.secondary" }} />
                      <Typography variant="body2">{doctor.phone}</Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Rating value={doctor.rating} readOnly precision={0.1} />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {doctor.rating}/5 ({doctor.reviewCount} avis)
                      </Typography>
                    </Box>

                    {doctor.availability.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <Schedule sx={{ mr: 1, verticalAlign: "middle" }} />
                          Créneaux disponibles:
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {doctor.availability
                            .slice(0, 3)
                            .map((slot, index) => (
                              <Chip key={index} label={slot} size="small" />
                            ))}
                        </Box>
                      </Box>
                    )}
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: "background.default" }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                        <Star sx={{ color: "gold", mr: 1 }} />
                        <Typography variant="h6">
                          Score AI: {doctor.aiAnalysis.score}/10
                        </Typography>
                      </Box>

                      <Typography variant="body2" paragraph>
                        {doctor.aiAnalysis.summary}
                      </Typography>

                      {doctor.aiAnalysis.pros.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="success.main">
                            Points positifs:
                          </Typography>
                          {doctor.aiAnalysis.pros.map((pro, index) => (
                            <Typography
                              key={index}
                              variant="body2"
                              sx={{ fontSize: "0.875rem" }}
                            >
                              • {pro}
                            </Typography>
                          ))}
                        </Box>
                      )}

                      {doctor.aiAnalysis.cons.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="warning.main">
                            Points d'attention:
                          </Typography>
                          {doctor.aiAnalysis.cons.map((con, index) => (
                            <Typography
                              key={index}
                              variant="body2"
                              sx={{ fontSize: "0.875rem" }}
                            >
                              • {con}
                            </Typography>
                          ))}
                        </Box>
                      )}

                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        {doctor.aiAnalysis.lgbtFriendly && (
                          <Chip
                            label="LGBT+ Friendly"
                            color="success"
                            size="small"
                          />
                        )}
                        {doctor.aiAnalysis.languages?.map((lang) => (
                          <Chip
                            key={lang}
                            label={lang}
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Button
                    variant="contained"
                    href={doctor.doctolibUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Prendre rendez-vous sur Doctolib
                  </Button>

                  <Typography variant="caption" color="text.secondary">
                    Analyse basée sur {doctor.reviewCount} avis Google
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Button variant="outlined" href="/">
          Nouvelle recherche
        </Button>
      </Box>
    </Box>
  );
};

export default ResultsPage;
