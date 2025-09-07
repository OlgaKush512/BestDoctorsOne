import { LocationOn, Phone, Schedule, Star } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Rating,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import React from "react";
import type { SearchParams, SearchResults } from "../types";

interface Props {
  results: SearchResults;
  searchParams: SearchParams;
  onNewSearch: () => void;
}

const PanelResults: React.FC<Props> = ({
  results,
  searchParams,
  onNewSearch,
}) => {
  if (!results || !results.doctors) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6">Aucun résultat trouvé</Typography>
        <Button onClick={onNewSearch} sx={{ mt: 2 }}>
          Nouvelle recherche
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Résultats de recherche
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {results.totalFound} docteurs trouvés pour{" "}
          <strong>{searchParams.specialty}</strong> à{" "}
          <strong>{searchParams.location}</strong>
        </Typography>
      </Paper>

      <Grid container spacing={2}>
        {results.doctors.map((doctor) => (
          <Grid item xs={12} key={doctor.id}>
            <Card elevation={2}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      Dr. {doctor.name}
                    </Typography>

                    <Typography
                      variant="subtitle2"
                      color="primary"
                      gutterBottom
                    >
                      {doctor.specialty}
                    </Typography>

                    <Box
                      sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
                    >
                      <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                      <Typography variant="body2">{doctor.address}</Typography>
                    </Box>

                    <Box
                      sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
                    >
                      <Phone sx={{ mr: 1, color: "text.secondary" }} />
                      <Typography variant="body2">{doctor.phone}</Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Rating value={doctor.rating} readOnly precision={0.1} />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {doctor.rating}/5 ({doctor.reviewCount} avis)
                      </Typography>
                    </Box>

                    {doctor.availability.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <Schedule sx={{ mr: 1, verticalAlign: "middle" }} />
                          Créneaux disponibles:
                        </Typography>
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {doctor.availability
                            .slice(0, 3)
                            .map((slot, index) => (
                              <Chip key={index} label={slot} size="small" />
                            ))}
                        </Box>
                      </Box>
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <Paper sx={{ p: 1.5, bgcolor: "background.default" }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Star sx={{ color: "gold", mr: 1 }} />
                        <Typography variant="subtitle1">
                          Score AI: {doctor.aiAnalysis.score}/10
                        </Typography>
                      </Box>

                      <Typography variant="body2" paragraph>
                        {doctor.aiAnalysis.summary}
                      </Typography>

                      {doctor.aiAnalysis.pros.length > 0 && (
                        <Box sx={{ mb: 1 }}>
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
                        <Box sx={{ mb: 1 }}>
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
                          gap: 0.5,
                          mb: 1,
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

                <Divider sx={{ my: 1.5 }} />

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
                    sx={{ mr: 1 }}
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

      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Button variant="outlined" onClick={onNewSearch}>
          Nouvelle recherche
        </Button>
      </Box>
    </Box>
  );
};

export default PanelResults;
