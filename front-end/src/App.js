import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import CssBaseline from "@mui/material/CssBaseline";
import {
  Box,
  Container,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  ThemeProvider,
  createTheme,
  FormControl,
  InputLabel,
  LinearProgress,
  CircularProgressProps,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Chip,
  Avatar,
} from "@mui/material";
import {
  CancelOutlined,
  Close,
  DownloadOutlined,
  SignalWifiOff,
  VideoFileOutlined,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { orange, pink, purple, red } from "@mui/material/colors";
import myicon from "./myicon.png";
import useOnlineStatus from "./hooks/useOnlineStatus";
// import { openFile } from './chrome-utils';

const theme = createTheme(
  //violet
  {
    palette: {
      primary: {
        // cicularbar: "#9c27b0",
        main: "#060047",
        success: "#16FF00",
        error: "#FF0032",
      },
      secondary: {
        main: "#E90064",
      },
      text: {
        // violet degrees
        primary: "#2D033B",
        secondary: "#3B3486",
        disabled: "#E5B8F4",
        mute: "#00337C",
      },
    },
  }
);

function CircularProgressWithLabel(props) {
  return (
    <Box sx={{ position: "relative", display: "inline-flex", my: 2 }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={250}
        sx={{
          // color: pink[100],
          color: "#E90064",
          position: "relative",
        }}
      />
      <CircularProgress
        variant="determinate"
        {...props}
        size={250}
        sx={{
          color: "#9c27b0",
          // color: purple[500],

          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
        }}
      />

      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <Typography
          variant="caption"
          component="div"
          color="text.primary"
          sx={{
            fontSize: 50,
            fontWeight: "bold",
          }}
        >
          {`${Math.round(props.value)}%`}
        </Typography>
        <Typography
          variant="caption"
          component="div"
          color="text.secondary"
          sx={{
            fontSize: 14,
            fontWeight: "semibold",
          }}
        >
          {`${Math.round(props.speed)} KB/s`}
        </Typography>

        {/* <Typography
          variant="caption"
          component="div"
          color="text.disabled"
          sx={{
            fontSize: 14,
            fontWeight: "italic",
          }}
        >
          {`${Math.round(props.time)} s`}
        </Typography> */}
      </Box>
    </Box>
  );
}

function LinearIndeterminate() {
  return (
    <Box
      sx={{
        width: "100%",
        my: "5",
        mt: "2",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <LinearProgress />
      <Typography
        variant="h6"
        align="center"
        color="text.secondary"
        gutterBottom
        sx={{
          fontSize: "13px",
        }}
      >
        Processing ...
      </Typography>
    </Box>
  );
}

function SnackBar({ message, type, handleClose, open }) {
  return (
    <Snackbar
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      action={
        <React.Fragment>
          <Button color="secondary" size="small" onClick={handleClose}>
            CLOSE
          </Button>
        </React.Fragment>
      }
    >
      <Alert onClose={handleClose} severity={type} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

function AbortButton({ onClick }) {
  return (
    <Button
      size="small"
      variant="outlined"
      color="error"
      onClick={onClick}
      startIcon={<CancelOutlined sx={{ color: red[500] }} />}
    >
      Abort
    </Button>
  );
}

function Message({ path, handleClose, name }) {
  const hanleClick = () => {
    navigator.clipboard.writeText(path);
  };
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      height="100%"
      mt={5}
    >
      <Box display="flex" alignItems="center" bgcolor="#F5F5F5" p={2}>
        {/* Icon */}

        {/* Text */}
        <Box textAlign="center">
          <Typography
            sx={{
              fontSize: 15,
            }}
          >
            File Downloaded
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            component="label"
            sx={{
              fontSize: 12,
              fontWeight: "bold",
              color: pink[700],
              mt: 2,
            }}
            onClick={hanleClick}
          >
            <VideoFileOutlined sx={{ fontSize: 35, color: pink[700] }} />
            {name}
          </Button>
          <InputLabel
            htmlFor="contained-button-file"
            sx={{
              fontSize: 13,
              fontWeight: "bold",
              color: orange[700],
              mt: 3,
            }}
          >
            *click to copy the file link
          </InputLabel>
        </Box>
        {/* Close button */}
        <Box ml="auto">
          <IconButton onClick={handleClose} sx={{ fontSize: 14 }}>
            <Close />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

function OnlineStatus({ online }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", marginY: 2 }}>
      <Chip
        label={
          online
            ? "You are online !"
            : "*Please check your network connection !"
        }
        color={online ? "success" : "error"}
      />
    </Box>
  );
}

function App() {
  const isOnline = useOnlineStatus();
  const [url, seturl] = useState("");
  const [quality, setquality] = useState("");
  const [format, setformat] = useState("");

  const [socket, setsocket] = useState(null);
  const [loading, setloading] = useState(false);
  const [progressBar, setprogressBar] = useState({
    progress: 0,
    total: 0,
    downloadSpeed: {
      percentage: 0,
      speed: 0,
      timeLeft: 0,
    },
  });
  const [message, setmessage] = useState("");
  const [data, setdata] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const socket = io("http://localhost:4500");
    setsocket(socket);
    // setloading(localStorage.getItem('loading') ?? localStorage.getItem('loading'))

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      connect();
      disconnect();
      download_progress();
      end();
      on_error();
      onCancelDownload();
      onStart();
    }
  }, [socket]);

  const connect = () => {
    socket.on("connect", () => {
      console.log("Connected to server");
      console.log("clientId", socket.id);
    });
  };

  const disconnect = () => {
    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });
  };

  const download_progress = () => {
    socket.on("downloadProgress", (data) => {
      setprogressBar(data);
      if (!loading) {
        setloading(true);
      }
      console.log(data);
    });
  };

  const resetData = () => {
    setdata(null);
  };

  const end = () => {
    socket.on("end", (data) => {
      setmessage(data.message);
      delete data.message;
      setdata(data);
      setOpen(true);
      setloading(false);
      localStorage.removeItem("loading");
      console.log(data);
    });
  };

  const on_error = () => {
    socket.on("downloadError", (data) => {
      setmessage(data);
      setloading(false);
      setOpen(true);
      localStorage.removeItem("loading");
      console.log(data);
    });
  };

  const base_url = "http://localhost:4500/";

  const handleSubmit = async (e) => {
    e.preventDefault();

    setmessage("");
    //reset progressbar
    setprogressBar({
      progress: 0,
      total: 0,
      downloadSpeed: {
        percentage: 0,
        speed: 0,
        timeLeft: 0,
      },
    });

    if (url === "" || quality === "" || format === "" || !isOnline) {
      return;
    }

    setloading(true);
    localStorage.setItem("loading", true);

    const res = await axios.get(base_url + "download", {
      params: {
        url: url.includes("watch?v=") ? url.split("watch?v=")[1] : url,
        q: quality,
        t: format,
      },
    });

    console.log(res.data);
    setloading(false);
  };

  const onStart = () => {
    socket.on("downloadStart", (data) => {
      localStorage.setItem("uuid", data.uuid);
    });
  };

  const cancelDownload = () => {
    if (socket && localStorage.getItem("uuid")) {
      console.log("canceling");
      socket.emit("cancel", {
        uuid: localStorage.getItem("uuid"),
      });
    }
  };

  const onCancelDownload = () => {
    socket.on("downloadAborted", (data) => {
      setloading(false);
      resetData();
      setprogressBar({
        progress: 0,
        total: 0,
        downloadSpeed: {
          percentage: 0,
          speed: 0,
          timeLeft: 0,
        },
      });
      localStorage.removeItem("loading");
      setmessage(data);
      setOpen(true);
    });
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm">
        <Box
          sx={{
            pt: 2,
            pb: 4,
            mb: 3,
            mt: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* <OnlineStatus online={isOnline} /> */}
          <Box
            sx={{
              bgcolor: "background.paper",
              pb: 1,
            }}
          >
            <img
              src={myicon}
              alt="myicon"
              style={{
                width: "70px",
                height: "70px",
                display: "block",
                margin: "auto",
              }}
            />
          </Box>

          <Typography
            variant="h5"
            align="center"
            color="text.mute"
            paragraph
            margin="0"
            padding="0"
            fontFamily="sans-serif"
            fontWeight="600"
          >
            YT Video Downloader
          </Typography>

          <Typography
            fontSize="10"
            size="small"
            align="center"
            color="text.mute"
            paragraph
            // marginBottom="2"
            padding="0"
            fontWeight="500"
          >
            Download Your Videos within few clicks.
          </Typography>

          <OnlineStatus online={isOnline} />

          {data?.name && (
            <Message
              name={data.name}
              path={data.path}
              handleClose={resetData}
            />
          )}
          {message !== "" && (
            <SnackBar
              type="success"
              variant="filled"
              message={message}
              handleClose={handleClose}
              open={open}
            />
          )}
          {loading && progressBar.downloadSpeed?.percentage < 1 && (
            <LinearIndeterminate />
          )}
          {loading
            ? progressBar.downloadSpeed?.percentage > 0 && (
                <>
                  <AbortButton onClick={cancelDownload} />
                  <CircularProgressWithLabel
                    value={progressBar.downloadSpeed.percentage}
                    time={progressBar.downloadSpeed.timeLeft}
                    speed={progressBar.downloadSpeed.speed}
                  />
                </>
              )
            : !data && (
                <form onSubmit={handleSubmit}>
                  <FormControl fullWidth sx={{ mt: 2, mb: 1 }}>
                    <TextField
                      fullWidth
                      id="url"
                      label="Enter YouTube Video URL"
                      variant="outlined"
                      required
                      disabled={!isOnline}
                      onChange={(e) => {
                        seturl(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormControl fullWidth sx={{ my: 1 }}>
                    <InputLabel id="demo-simple-select-label">
                      Quality / Resolution
                    </InputLabel>

                    <Select
                      fullWidth
                      id="quality"
                      label="Quality / Resolution"
                      variant="outlined"
                      required
                      disabled={!isOnline}
                      value={quality}
                      onChange={(e) => {
                        setquality(e.target.value);
                      }}
                    >
                      <MenuItem value="highestvideo">Highest Video</MenuItem>
                      {/* <MenuItem value="highest">Highest</MenuItem>
                      <MenuItem value="lowest">Lowest</MenuItem> */}
                      <MenuItem value="highestaudio">Highest Audio</MenuItem>
                      <MenuItem value="lowestaudio">Lowest Audio</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth sx={{ my: 1 }}>
                    <InputLabel id="demo-simple-select-label">
                      Select Format
                    </InputLabel>
                    <Select
                      fullWidth
                      id="format"
                      label="Select Format"
                      variant="outlined"
                      required
                      disabled={!isOnline}
                      value={format}
                      onChange={(e) => {
                        setformat(e.target.value);
                      }}
                    >
                      <MenuItem value="videoandaudio">Video/Audio</MenuItem>
                      {/* <MenuItem value="video">Video</MenuItem>
                      <MenuItem value="audio">Audio</MenuItem> */}
                      <MenuItem value="audioonly">Audio only </MenuItem>
                      <MenuItem value="videoonly">Video only</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={!isOnline}
                    sx={{ mt: 2, fontWeight: "bold" }}
                  >
                    {isOnline ? (
                      <>
                        <DownloadOutlined
                          sx={{ fontSize: 35, color: "white" }}
                        />
                        Download
                      </>
                    ) : (
                      <SignalWifiOff sx={{ fontSize: 35, color: "white" }} />
                    )}
                  </Button>
                </form>
              )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
