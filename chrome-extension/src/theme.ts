import { createTheme } from "@mui/material/styles";

// Создаем кастомную тему с медицинскими цветами и современным дизайном
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2E7D32", // Медицинский зеленый
      light: "#4CAF50",
      dark: "#1B5E20",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#1976D2", // Доверительный синий
      light: "#42A5F5",
      dark: "#0D47A1",
      contrastText: "#ffffff",
    },
    background: {
      default: "#F8FFFE",
      paper: "#FFFFFF",
    },
    success: {
      main: "#4CAF50",
      light: "#81C784",
      dark: "#388E3C",
    },
    info: {
      main: "#29B6F6",
      light: "#4FC3F7",
      dark: "#0288D1",
    },
    warning: {
      main: "#FF9800",
      light: "#FFB74D",
      dark: "#F57C00",
    },
    error: {
      main: "#F44336",
      light: "#EF5350",
      dark: "#D32F2F",
    },
    text: {
      primary: "#1A1A1A",
      secondary: "#666666",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: "1.125rem",
      fontWeight: 500,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "12px 24px",
          fontSize: "1rem",
          fontWeight: 500,
          textTransform: "none",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          },
        },
        contained: {
          background: "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #1B5E20 0%, #388E3C 100%)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        },
        elevation3: {
          boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#4CAF50",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#2E7D32",
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#4CAF50",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#2E7D32",
            borderWidth: 2,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(135deg, #2E7D32 0%, #1976D2 100%)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
          },
        },
      },
    },
  },
});
