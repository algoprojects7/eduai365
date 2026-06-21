'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Button } from '@eduai365/ui';
import { BookOpen, Search, X, Camera, AlertTriangle } from 'lucide-react';
import { defaultDueDate } from '@/lib/operations';
import type { IssueBookInput, LibraryBook, LibraryIssue } from '@/types/operations';
import jsQR from 'jsqr';

// ─── Issue from catalog row (book pre-selected) ─────────────────────────────

interface LibraryIssueModalProps {
  open: boolean;
  book: LibraryBook | null;
  onClose: () => void;
  onSubmit: (input: IssueBookInput) => Promise<void>;
}

export function LibraryIssueModal({ open, book, onClose, onSubmit }: LibraryIssueModalProps) {
  const [studentId, setStudentId] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStudentScanner, setShowStudentScanner] = useState(false);

  useEffect(() => {
    if (open) {
      setStudentId('');
      setDueDate(defaultDueDate());
      setError(null);
      setShowStudentScanner(false);
    }
  }, [open]);

  if (!open || !book) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await onSubmit({ bookId: book!.id, studentId: studentId.trim(), dueDate });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue book');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bento-card w-full max-w-md p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-title-lg font-semibold text-on-surface">Issue Book</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">{book.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-on-surface-variant transition hover:bg-surface-faint"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-label-md text-on-surface-variant">Student ID</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. STU-2024-0142"
                required
                className="flex-1 rounded-lg border border-gray-300/30 bg-white px-3 py-2 text-body-md outline-none focus:border-secondary"
              />
              <button
                type="button"
                onClick={() => setShowStudentScanner(true)}
                title="Scan Student ID QR Code"
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-2 text-body-sm font-medium text-secondary transition hover:bg-secondary/20"
              >
                <Camera className="h-4 w-4" />
                <span>Scan ID</span>
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-label-md text-on-surface-variant">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300/30 bg-white px-3 py-2 text-body-md outline-none focus:border-secondary"
            />
          </div>
          <p className="text-body-md text-on-surface-variant">
            Available copies: {book.available} · Fine ₹2/day after due date
          </p>
          {error && <p className="text-body-md text-error">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting || !studentId.trim()}>
              {submitting ? 'Issuing…' : 'Issue Book'}
            </Button>
          </div>
        </form>
      </div>

      <StudentIdQrScannerModal
        isOpen={showStudentScanner}
        onClose={() => setShowStudentScanner(false)}
        onScanSuccess={(id) => {
          setStudentId(id);
          setShowStudentScanner(false);
        }}
      />
    </div>
  );
}

// ─── Student ID QR Scanner Modal ─────────────────────────────────────────────

const DEMO_STUDENT_IDS = [
  'STU-2024-0142',
  'STU-2024-0217',
  'STU-2024-0389',
  'STU-2025-0001',
  'STU-2025-0056',
];

interface StudentIdQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (studentId: string) => void;
}

function StudentIdQrScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: StudentIdQrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    let animFrameId: number;

    const startCamera = async () => {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (active && videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          animFrameId = requestAnimationFrame(tick);
        } else {
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch {
        if (active)
          setCameraError('Camera unavailable. Grant camera permission or use the list below.');
      }
    };

    const tick = () => {
      if (!active) return;
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current ?? document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code?.data) {
            onScanSuccess(code.data);
            return;
          }
        }
      }
      animFrameId = requestAnimationFrame(tick);
    };

    void startCamera();

    return () => {
      active = false;
      cancelAnimationFrame(animFrameId);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-950 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <h3 className="text-title-lg font-semibold text-white">Scan Student ID</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
            aria-label="Close scanner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera view */}
        <div className="px-5 py-4">
          <div className="relative mx-auto h-52 w-full overflow-hidden rounded-xl border border-gray-800 bg-black">
            {!cameraError ? (
              <>
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-0 border-[20px] border-black/40" />
                  <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded border-2 border-dashed border-blue-400" />
                  <div className="absolute left-1/2 top-1/2 h-0.5 w-full -translate-y-1/2 animate-pulse bg-blue-500 opacity-70 shadow-[0_0_12px_#3b82f6]" />
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-gray-400">
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
                <p className="text-body-sm">{cameraError}</p>
              </div>
            )}
          </div>
          <p className="mt-2 text-center text-body-xs text-gray-500">
            Point the student&apos;s ID card QR code at the camera to fill automatically.
          </p>
        </div>

        {/* Simulation list */}
        <div className="border-t border-gray-800 px-5 pb-5">
          <p className="mb-2.5 text-label-md font-semibold text-gray-300">Simulate Scan (Testing)</p>
          <div className="space-y-1.5">
            {DEMO_STUDENT_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onScanSuccess(id)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-800/50 bg-gray-900 px-3 py-2 text-left transition hover:bg-gray-800"
              >
                <span className="font-mono text-body-sm font-semibold text-gray-200">{id}</span>
                <span className="text-body-xs text-gray-500">tap to select</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// ─── Quick Issue from header button (book search included) ───────────────────

interface LibraryQuickIssueModalProps {
  open: boolean;
  catalog: LibraryBook[];
  onClose: () => void;
  onSubmit: (input: IssueBookInput) => Promise<void>;
}

export function LibraryQuickIssueModal({
  open,
  catalog,
  onClose,
  onSubmit,
}: LibraryQuickIssueModalProps) {
  const [bookSearch, setBookSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [studentId, setStudentId] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showStudentScanner, setShowStudentScanner] = useState(false);

  useEffect(() => {
    if (open) {
      setBookSearch('');
      setSelectedBook(null);
      setStudentId('');
      setDueDate(defaultDueDate());
      setError(null);
      setShowScanner(false);
      setShowStudentScanner(false);
    }
  }, [open]);

  const bookResults = useMemo(() => {
    const q = bookSearch.trim().toLowerCase();
    if (!q) return [];
    return catalog
      .filter(
        (b) =>
          b.available > 0 &&
          (b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.isbn.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [bookSearch, catalog]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedBook) return;
    setError(null);
    setSubmitting(true);

    try {
      await onSubmit({ bookId: selectedBook.id, studentId: studentId.trim(), dueDate });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue book');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bento-card w-full max-w-lg p-6 shadow-card">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-title-lg font-semibold text-on-surface">Issue Book</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Search for a book and issue it to a student
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-on-surface-variant transition hover:bg-surface-faint"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          {/* Book search */}
          <div>
            <label className="mb-1 block text-label-md text-on-surface-variant">Book</label>
            {selectedBook ? (
              <div className="flex items-center justify-between rounded-lg border border-secondary/40 bg-secondary/5 px-3 py-2">
                <div>
                  <p className="text-body-md font-medium text-on-surface">{selectedBook.title}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    {selectedBook.author} · {selectedBook.available} copies available
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBook(null);
                    setBookSearch('');
                  }}
                  className="ml-2 rounded p-1 text-on-surface-variant hover:bg-surface-faint"
                  aria-label="Change book"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      type="text"
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      placeholder="Search by title, author, or ISBN…"
                      autoFocus
                      className="w-full rounded-lg border border-gray-300/30 bg-white py-2 pl-9 pr-3 text-body-md outline-none focus:border-secondary"
                    />
                    {bookResults.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                        {bookResults.map((book) => (
                          <li key={book.id}>
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-faint"
                              onClick={() => {
                                setSelectedBook(book);
                                setBookSearch('');
                              }}
                            >
                              <BookOpen className="h-4 w-4 shrink-0 text-on-surface-variant" strokeWidth={1.5} />
                              <div className="min-w-0">
                                <p className="truncate text-body-md font-medium text-on-surface">
                                  {book.title}
                                </p>
                                <p className="text-body-sm text-on-surface-variant">
                                  {book.author} · {book.available}/{book.copies} available
                                </p>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    title="Scan QR Code"
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-2 text-body-sm font-medium text-secondary transition hover:bg-secondary/20"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Scan QR</span>
                  </button>
                </div>
                {bookSearch.trim() && bookResults.length === 0 && (
                  <p className="text-body-sm text-on-surface-variant">
                    No available books match your search.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Student ID */}
          <div>
            <label className="mb-1 block text-label-md text-on-surface-variant">Student ID</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. STU-2024-0142"
                required
                className="flex-1 rounded-lg border border-gray-300/30 bg-white px-3 py-2 text-body-md outline-none focus:border-secondary"
              />
              <button
                type="button"
                onClick={() => setShowStudentScanner(true)}
                title="Scan Student ID QR Code"
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-2 text-body-sm font-medium text-secondary transition hover:bg-secondary/20"
              >
                <Camera className="h-4 w-4" />
                <span>Scan ID</span>
              </button>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="mb-1 block text-label-md text-on-surface-variant">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300/30 bg-white px-3 py-2 text-body-md outline-none focus:border-secondary"
            />
          </div>

          <p className="text-body-sm text-on-surface-variant">Fine: ₹2/day after due date</p>

          {error && <p className="text-body-md text-error">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || !selectedBook || !studentId.trim()}
            >
              {submitting ? 'Issuing…' : 'Issue Book'}
            </Button>
          </div>
        </form>
      </div>

      {/* QR Scanner overlay – rendered inside the modal's z-layer */}
      <LibraryQrScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        catalog={catalog}
        onScanSuccess={(scannedIsbn) => {
          setShowScanner(false);
          // Find first available book matching the ISBN
          const matched = catalog.find(
            (b) => b.isbn.toLowerCase() === scannedIsbn.toLowerCase() && b.available > 0
          );
          if (matched) {
            setSelectedBook(matched);
            setBookSearch('');
          } else {
            // Fall back to pre-filling the search so the user can see results
            setBookSearch(scannedIsbn);
          }
        }}
      />

      {/* Student ID QR Scanner */}
      <StudentIdQrScannerModal
        isOpen={showStudentScanner}
        onClose={() => setShowStudentScanner(false)}
        onScanSuccess={(id) => {
          setStudentId(id);
          setShowStudentScanner(false);
        }}
      />
    </div>
  );
}

// ─── Return Book ─────────────────────────────────────────────────────────────

interface LibraryReturnModalProps {
  open: boolean;
  issue: LibraryIssue | null;
  onClose: () => void;
  onSubmit: (issueId: string) => Promise<void>;
}

export function LibraryReturnModal({ open, issue, onClose, onSubmit }: LibraryReturnModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  if (!open || !issue) return null;

  const fine = issue.fineAmount ?? 0;

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);

    try {
      await onSubmit(issue!.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to return book');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bento-card w-full max-w-md p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-title-lg font-semibold text-on-surface">Return Book</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">{issue.bookTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-on-surface-variant transition hover:bg-surface-faint"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-3 text-body-md">
          <p>
            <span className="text-on-surface-variant">Student:</span>{' '}
            <span className="font-medium text-on-surface">
              {issue.studentName} ({issue.studentClass})
            </span>
          </p>
          <p>
            <span className="text-on-surface-variant">Due:</span>{' '}
            <span className="font-medium text-on-surface">
              {new Date(issue.dueDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </p>
          {fine > 0 && (
            <p className="rounded-lg bg-warning/10 px-3 py-2 text-warning">
              Overdue fine: ₹{fine.toLocaleString('en-IN')}
            </p>
          )}
          {error && <p className="text-error">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? 'Processing…' : 'Confirm Return'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Library QR Scanner Modal ────────────────────────────────────────────────

interface LibraryQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: LibraryBook[];
  onScanSuccess: (isbn: string) => void;
}

function LibraryQrScannerModal({
  isOpen,
  onClose,
  catalog,
  onScanSuccess,
}: LibraryQrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Books that have an ISBN and are available — used for the simulation list
  const booksWithIsbn = useMemo(
    () => catalog.filter((b) => b.isbn && b.isbn.trim() !== '' && b.available > 0),
    [catalog]
  );

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    let animFrameId: number;

    const startCamera = async () => {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (active && videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          animFrameId = requestAnimationFrame(tick);
        } else {
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch {
        if (active)
          setCameraError('Camera unavailable. Grant camera permission or use the list below.');
      }
    };

    const tick = () => {
      if (!active) return;
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current ?? document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code?.data) {
            onScanSuccess(code.data);
            return; // stop the loop once decoded
          }
        }
      }
      animFrameId = requestAnimationFrame(tick);
    };

    void startCamera();

    return () => {
      active = false;
      cancelAnimationFrame(animFrameId);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-950 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <h3 className="text-title-lg font-semibold text-white">Scan Book QR Code</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
            aria-label="Close scanner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera view */}
        <div className="px-5 py-4">
          <div className="relative mx-auto h-56 w-full overflow-hidden rounded-xl bg-black border border-gray-800">
            {!cameraError ? (
              <>
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                />
                {/* Hidden canvas for frame analysis */}
                <canvas ref={canvasRef} className="hidden" />
                {/* Targeting overlay */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-0 border-[20px] border-black/40" />
                  <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded border-2 border-dashed border-green-400" />
                  <div className="absolute left-1/2 top-1/2 h-0.5 w-full -translate-y-1/2 bg-green-500 opacity-70 shadow-[0_0_12px_#22c55e] animate-pulse" />
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-gray-400">
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
                <p className="text-body-sm">{cameraError}</p>
              </div>
            )}
          </div>
          <p className="mt-2 text-center text-body-xs text-gray-500">
            Point the book&apos;s ISBN QR label at the camera to scan automatically.
          </p>
        </div>

        {/* Simulation list */}
        <div className="border-t border-gray-800 px-5 pb-5">
          <p className="mb-2.5 text-label-md font-semibold text-gray-300">Simulate Scan (Testing)</p>
          {booksWithIsbn.length === 0 ? (
            <p className="text-body-sm italic text-gray-600">No catalog books with ISBNs available.</p>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-0.5">
              {booksWithIsbn.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => onScanSuccess(book.isbn)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-800/50 bg-gray-900 px-3 py-2 text-left transition hover:bg-gray-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm font-medium text-gray-200">{book.title}</p>
                    <p className="truncate text-body-xs text-gray-500">{book.author}</p>
                  </div>
                  <span className="shrink-0 rounded border border-secondary/25 bg-secondary/10 px-2 py-0.5 font-mono text-xs font-semibold text-secondary">
                    {book.isbn}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

