"use client";

import { useEffect, useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSessionData from "../hook/useSessionData";
import Spinner from "../components/ui/Spinner";
import Image from "next/image";
import axios from "axios";
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
} from "@mui/material";

const LoginForm: React.FC = () => {
  const router = useRouter();
  const { session, loading } = useSessionData();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [lockedUsers, setLockedUsers] = useState<any[]>([]);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [lockPassword, setLockPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [isSystemLocked, setIsSystemLocked] = useState(false);
  const hasRun = useRef(false);

  // First-time installation user setup and locked user check
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const checkAndCreateDefaultUsers = async () => {
      try {
        // Fetch existing users
        const response = await axios.get("/api/register");
        const existingUsers = response.data;
        const existingPhones = existingUsers.map((u: any) => u.phone);

        // Check for admin
        const hasAdmin = existingUsers.some((u: any) => u.role === "admin");

        const defaultUsers = [
          {
            username: "Admin",
            password: "admin123",
            role: "admin",
            phone: "0911000000",
          },
          {
            username: "User",
            password: "user123",
            role: "User",
            phone: "0911000001",
            deadlinetime: new Date(Date.now() - 1000 * 60), // 1 minute in the past for testing
          },
        ];

        // Create default users if they don't exist
        for (const user of defaultUsers) {
          if (!existingPhones.includes(user.phone)) {
            try {
              await axios.post(
                "/api/register",
                new URLSearchParams({
                  username: user.username,
                  password: user.password,
                  role: user.role,
                  phone: user.phone,
                  ...(user.deadlinetime && {
                    deadlinetime: user.deadlinetime.toISOString(),
                  }),
                }),
                {
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                }
              );
            } catch (error: any) {
              if (
                error.response?.status === 400 &&
                error.response?.data?.error.includes("already exists")
              ) {
                console.log(
                  `User with phone ${user.phone} already exists, skipping...`
                );
              } else {
                console.error(
                  `Failed to create user ${user.username}:`,
                  error.response?.data || error.message
                );
              }
            }
          } else {
            console.log(`User with phone ${user.phone} already exists, skipping...`);
          }
        }

        // If no admin was found, ensure one is created
        if (!hasAdmin) {
          console.log("No admin found, ensuring admin creation...");
          if (!existingPhones.includes("0911000000")) {
            await axios.post(
              "/api/register",
              new URLSearchParams({
                username: "Admin",
                password: "admin123",
                role: "admin",
                phone: "0911000000",
              }),
              {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              }
            );
            console.log("Created admin user");
          }
        }

        // Check for locked users - only show system lock if ALL users are locked
        const locked = existingUsers.filter((u: any) => u.lock === true);
        setLockedUsers(locked);
        
        // Check if system should be locked (all non-admin users are locked)
        const nonAdminUsers = existingUsers.filter((u: any) => u.role !== "admin");
        const lockedNonAdminUsers = nonAdminUsers.filter((u: any) => u.lock === true);
        
        // If all non-admin users are locked, show system lock
        if (nonAdminUsers.length > 0 && lockedNonAdminUsers.length === nonAdminUsers.length) {
          setIsSystemLocked(true);
          setPasswordModalOpen(true);
        }
      } catch (err) {
        console.error("Error checking or creating default users:", err);
      }
    };

    checkAndCreateDefaultUsers();
  }, [session]);

  // Handle login form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      // First check if the specific user is locked
      const usersResponse = await axios.get("/api/register");
      const allUsers = usersResponse.data;
      const currentUser = allUsers.find((u: any) => u.phone === phone);
      
      if (currentUser && currentUser.lock) {
        setErrorMessage("This account is locked. Please contact an administrator.");
        return;
      }

      // If user is not locked, proceed with normal login
      const result = await signIn("credentials", {
        redirect: false,
        phone,
        password,
      });

      if (result?.error) {
        setErrorMessage("Incorrect phone or password");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setErrorMessage("Login failed. Please try again.");
    }
  };

  // Handle password verification for unlocking the system
  const handleVerifyPassword = async () => {
    setVerifying(true);
    setPasswordError("");
    try {
      const response = await axios.post("/api/register/user", { password: lockPassword });
      if (response.data.success) {
        setPasswordModalOpen(false);
        setIsSystemLocked(false);
        // Refresh the locked users list
        const updatedUsers = await axios.get("/api/register");
        setLockedUsers(updatedUsers.data.filter((u: any) => u.lock === true));
      } else {
        setPasswordError("Incorrect password");
      }
    } catch (error) {
      setPasswordError("Error verifying password");
    } finally {
      setVerifying(false);
    }
  };

  // Redirect based on user role
  useEffect(() => {
    if (loading) return;
    if (!session) return;

    const userRole = session.user?.role;
    switch (userRole) {
      case "admin":
        router.push("/admin");
        break;
      case "doctor":
        router.push("/doctor/CompanyProfile");
        break;
      case "reception":
        router.push("/reception/CompanyProfile");
        break;
      case "User":
        router.push("/user");
        break;
      case "nurse":
        router.push("/nurse/CompanyProfile");
        break;  
      case "labratory":
        router.push("/labratory/CompanyProfile");
        break;  
      default:
        router.push("/unauthorized");
    }
  }, [router, session, loading]);

  if (loading) return <Spinner />;

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Render system lock prompt only if system is completely locked
  if (isSystemLocked && !session) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          p: 3,
          bgcolor: "black",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            maxWidth: 700,
            width: "100%",
            textAlign: "center",
            backgroundColor: "#1e1e1e",
            color: "white",
            borderRadius: 2,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            System Locked
          </Typography>
          <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
            This system has expired. Please contact an administrator for access.
          </Typography>
          <Button
            variant="contained"
            onClick={() => setPasswordModalOpen(true)}
            sx={{ 
              mt: 2, 
              px: 3, 
              py: 1,
              backgroundColor: "#4caf50",
              "&:hover": {
                backgroundColor: "#388e3c",
              }
            }}
          >
            Unlock with Password
          </Button>
        </Paper>

        <Dialog
          open={passwordModalOpen}
          onClose={(_, reason) => {
            if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
              setPasswordModalOpen(false);
            }
          }}
          disableEscapeKeyDown
          sx={{
            "& .MuiDialog-container": {
              backdropFilter: "blur(5px)",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
            },
          }}
          PaperProps={{
            sx: {
              width: "100%",
              maxWidth: "500px",
              backgroundColor: "#1e1e1e",
              color: "white",
              borderRadius: "8px",
            },
          }}
        >
          <DialogTitle sx={{ color: "white" }}>Enter Unlock Password</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: "white" }}>
              Please enter the system unlock password to continue.
            </DialogContentText>

            <TextField
              autoFocus
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={lockPassword}
              onChange={(e) => setLockPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              sx={{
                "& .MuiInputBase-root": {
                  color: "white",
                },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "gray.600",
                  },
                  "&:hover fieldset": {
                    borderColor: "gray.500",
                  },
                },
                "& .MuiFormLabel-root": {
                  color: "gray.400",
                },
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleVerifyPassword}
              disabled={verifying || !lockPassword}
              startIcon={verifying ? <CircularProgress size={20} /> : null}
              sx={{
                color: "white",
                backgroundColor: "#4caf50",
                "&:hover": {
                  backgroundColor: "#388e3c",
                },
              }}
            >
              Verify
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
   <div
  className="flex min-h-screen items-center justify-center bg-cover bg-center px-4"
  style={{ backgroundImage: `url('bg6.jpg')` }}
>
  <div className="flex w-full max-w-4xl rounded-3xl  overflow-hidden">
    <div className="w-full md:w-1/2 p-6 bg-gray-50/90 backdrop-blur-md">
      <div className="flex flex-col items-center py-6">
        <Image
          src="/assets/file.png"
          alt="Example Image"
          width={100}
          height={100}
          priority
        />
        <h2 className="mt-3 text-2xl font-bold text-blue-900 py-1 rounded">
          Yanet Special Dental Clinic 
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            Phone
          </label>
          <input
            id="phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 border border-blue-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-600 bg-white/80"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 border border-blue-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-600 bg-white/80"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-3 flex items-center text-blue-600 hover:text-blue-800"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-900 transition shadow-lg focus:ring-2 focus:ring-blue-400 focus:outline-none font-medium"
        >
          Login
        </button>

        {errorMessage && (
          <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
        )}
      </form>

      <div className="mt-8 text-center text-sm text-gray-600">
        Powered by{" "}
        <span className="font-semibold text-blue-900">SmartDent</span>
      </div>
    </div>

    <div className="hidden md:flex w-1/2 items-center justify-center relative">
      <Image
        src="/YANDOC.jpg"
        alt="Dental Clinic"
        layout="responsive"
        width={16}
        height={15}
        className="object-cover"
      />
    </div>
  </div>
</div>
  );
};

export default LoginForm;