import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import axiosInstance from "../../axios/axios";

const PROGRAMS = ["Engineering", "MBA", "Masters", "UG"];

const lettersOnly = (v) => v.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3);

/**
 * Placement cell: create class codes (PPP-TTT-YY) and see the ones already created.
 * The college code (PPP) is chosen with the first code and then locked.
 */
export default function CohortCodesDialog({ open, onClose, info, onChanged }) {
  const lockedPrefix = info?.collegeCode || "";
  const thisYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 6 }, (_, i) => thisYear + i), [thisYear]);

  const [collegeName, setCollegeName] = useState("");
  const [collegeCode, setCollegeCode] = useState("");
  const [program, setProgram] = useState("");
  const [tag, setTag] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [prefixStatus, setPrefixStatus] = useState({ checked: false, available: true, message: "" });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { severity, message }

  useEffect(() => {
    if (open) {
      setCollegeName(info?.collegeName || "");
      setCollegeCode(info?.collegeCode || "");
      setFeedback(null);
    }
  }, [open, info]);

  // Live "already taken" check for the college code (only until it is locked)
  useEffect(() => {
    if (lockedPrefix || collegeCode.length !== 3) {
      setPrefixStatus({ checked: false, available: true, message: "" });
      return undefined;
    }
    const t = setTimeout(async () => {
      try {
        const res = await axiosInstance.get("/cohort/prefix-available", { params: { code: collegeCode } });
        setPrefixStatus({ checked: true, available: res.data.available, message: res.data.message });
      } catch {
        setPrefixStatus({ checked: false, available: true, message: "" });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [collegeCode, lockedPrefix]);

  const prefix = lockedPrefix || collegeCode;
  const preview =
    prefix.length === 3 && tag.length === 3 && batchYear
      ? `${prefix}-${tag}-${String(batchYear).slice(-2)}`
      : "";
  const canGenerate = !!preview && !!program && prefixStatus.available && !saving;

  const handleGenerate = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await axiosInstance.post("/cohort/codes", {
        collegeName,
        collegeCode: lockedPrefix ? undefined : collegeCode,
        program,
        tag,
        batchYear,
      });
      setFeedback({ severity: "success", message: `Code ${res.data.code} created. Share it with your students.` });
      setTag("");
      setBatchYear("");
      onChanged?.();
    } catch (err) {
      setFeedback({
        severity: "error",
        message: err.response?.data?.message || "Could not create the code. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const copy = (text) => {
    try {
      navigator.clipboard.writeText(text);
      setFeedback({ severity: "success", message: `${text} copied.` });
    } catch {
      setFeedback({ severity: "error", message: "Could not copy. Please copy it manually." });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>My class codes</DialogTitle>
      <DialogContent dividers>
        {!lockedPrefix && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Once you create your first code, this dashboard will list only students who join with your codes.
          </Alert>
        )}
        {feedback && (
          <Alert severity={feedback.severity} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
            {feedback.message}
          </Alert>
        )}

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", flex: 1, minWidth: 260 }}>
            <TextField
              size="small"
              label="College name"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              sx={{ flex: "1 1 100%" }}
            />
            <TextField
              size="small"
              label="College code"
              value={prefix}
              onChange={(e) => setCollegeCode(lettersOnly(e.target.value))}
              disabled={!!lockedPrefix}
              error={!prefixStatus.available}
              helperText={
                lockedPrefix
                  ? "Locked"
                  : prefixStatus.checked
                    ? prefixStatus.message
                    : "3 letters, e.g. VIT"
              }
              sx={{ width: 140 }}
            />
            <TextField
              size="small"
              select
              label="Program"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              sx={{ width: 150 }}
            >
              {PROGRAMS.map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Specialisation"
              value={tag}
              onChange={(e) => setTag(lettersOnly(e.target.value))}
              helperText="3 letters, e.g. CSE"
              sx={{ width: 140 }}
            />
            <TextField
              size="small"
              select
              label="Batch"
              value={batchYear}
              onChange={(e) => setBatchYear(e.target.value)}
              sx={{ width: 110 }}
            >
              {years.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>
          </Box>

          <Box
            sx={{
              minWidth: 190,
              p: 2,
              border: "1px dashed #94a3b8",
              borderRadius: 2,
              textAlign: "center",
              alignSelf: "stretch",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 1.5,
            }}
          >
            <Typography variant="caption" color="text.secondary">Your code</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 1, minHeight: 36 }}>
              {preview || "—"}
            </Typography>
            <Button variant="contained" disabled={!canGenerate} onClick={handleGenerate}>
              {saving ? "Generating..." : "Generate"}
            </Button>
          </Box>
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 700 }}>
          Codes created
        </Typography>
        {(info?.codes || []).length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No codes yet. Create one above and share it with the class.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Program</TableCell>
                <TableCell>Batch</TableCell>
                <TableCell align="right">Students</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {info.codes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{c.code}</TableCell>
                  <TableCell>{c.program}</TableCell>
                  <TableCell>{c.batchYear}</TableCell>
                  <TableCell align="right">{c.students}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Copy code">
                      <IconButton size="small" onClick={() => copy(c.code)}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
