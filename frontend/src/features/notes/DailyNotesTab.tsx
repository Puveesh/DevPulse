import { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  Loader2,
  AlertCircle,
  FileText,
  Plus,
  History,
} from 'lucide-react';
import { DailyNoteEditor } from './DailyNoteEditor';
import {
  useDailyNote,
  useDailyNotesHistory,
  useSaveDailyNote,
} from '../../hooks/useDailyNotes';
import { formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import type { Task, WorkSession } from '../../types';

interface DailyNotesTabProps {
  projectId: string;
  tasks?: Task[];
  sessions?: WorkSession[];
  onSelectTask?: (taskId: string) => void;
  onSelectSession?: (sessionId: string) => void;
}

// Format Date object to 'YYYY-MM-DD'
function toISODateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format 'YYYY-MM-DD' to human readable date
function formatDisplayDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function DailyNotesTab({
  projectId,
  tasks = [],
  sessions = [],
  onSelectTask,
  onSelectSession,
}: DailyNotesTabProps) {
  const todayStr = toISODateString(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [editorContent, setEditorContent] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [showHistory, setShowHistory] = useState<boolean>(true);

  // Queries & Mutations
  const { data: currentNote, isLoading: isNoteLoading } = useDailyNote(projectId, selectedDate);
  const { data: history = [] } = useDailyNotesHistory(projectId);
  const saveNoteMutation = useSaveDailyNote(projectId);

  // Synchronize editor content when selectedDate changes or note is loaded
  const lastLoadedContentRef = useRef<string>('');
  useEffect(() => {
    if (currentNote) {
      setEditorContent(currentNote.content);
      lastLoadedContentRef.current = currentNote.content;
    } else {
      setEditorContent('');
      lastLoadedContentRef.current = '';
    }
    setIsDirty(false);
    setSaveStatus('saved');
  }, [selectedDate, currentNote]);

  // Debounced Autosave (1500ms debounce after user stops typing)
  useEffect(() => {
    if (!isDirty || editorContent === lastLoadedContentRef.current) {
      return;
    }

    setSaveStatus('unsaved');
    const timer = setTimeout(() => {
      handleSave();
    }, 1500);

    return () => clearTimeout(timer);
  }, [editorContent, isDirty]);

  const handleSave = () => {
    if (!editorContent.trim() && !lastLoadedContentRef.current) {
      setIsDirty(false);
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('saving');
    saveNoteMutation.mutate(
      { date: selectedDate, content: editorContent },
      {
        onSuccess: () => {
          lastLoadedContentRef.current = editorContent;
          setIsDirty(false);
          setSaveStatus('saved');
        },
        onError: () => {
          setSaveStatus('error');
        },
      }
    );
  };

  const handleDateChange = (newDate: string) => {
    if (isDirty) {
      // Save pending edits immediately before changing dates
      handleSave();
    }
    setSelectedDate(newDate);
  };

  const handleStepDay = (step: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + step);
    handleDateChange(toISODateString(date));
  };

  const isToday = selectedDate === todayStr;

  return (
    <div className="space-y-4">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/40">
        {/* Date Selector & Step Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
            <button
              type="button"
              onClick={() => handleStepDay(-1)}
              title="Previous Day"
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <label className="flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-zinc-200 cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{formatDisplayDate(selectedDate)}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && handleDateChange(e.target.value)}
                className="opacity-0 w-0 h-0 absolute pointer-events-none"
              />
            </label>

            <button
              type="button"
              onClick={() => handleStepDay(1)}
              title="Next Day"
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!isToday && (
            <button
              type="button"
              onClick={() => handleDateChange(todayStr)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-750 text-blue-400 border border-zinc-700/60 transition-colors cursor-pointer"
            >
              Today
            </button>
          )}

          <button
            type="button"
            onClick={() => handleDateChange(todayStr)}
            title="Create or go to today's note"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
        </div>

        {/* Save Status & Action Controls */}
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="text-xs flex items-center gap-1.5 font-medium">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-blue-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>Saved</span>
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Unsaved changes</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-red-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Save failed</span>
              </span>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            leftIcon={<Save className="w-3.5 h-3.5" />}
            onClick={handleSave}
            disabled={saveStatus === 'saving' || !isDirty}
          >
            Save
          </Button>

          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            title="Toggle Notes History"
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              showHistory
                ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
            {history.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 font-mono text-zinc-300">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Editor & History Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Editor Area */}
        <div className={showHistory ? 'lg:col-span-3 space-y-3' : 'lg:col-span-4 space-y-3'}>
          {isNoteLoading ? (
            <div className="h-[380px] rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-center text-xs text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400 mr-2" />
              Loading note for {formatDisplayDate(selectedDate)}...
            </div>
          ) : (
            <DailyNoteEditor
              content={editorContent}
              onChange={(newHtml) => {
                setEditorContent(newHtml);
                setIsDirty(true);
              }}
              tasks={tasks}
              sessions={sessions}
              onSelectTask={onSelectTask}
              onSelectSession={onSelectSession}
            />
          )}

          <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
            <span>Tip: Type <strong className="text-zinc-400 font-mono">@</strong> to mention tasks or work sessions.</span>
            {currentNote && (
              <span>Last updated: {formatDisplayDate(selectedDate)}</span>
            )}
          </div>
        </div>

        {/* Notes History Side Section */}
        {showHistory && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-2.5">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Journal History</span>
              </h4>
              <span className="text-[10px] text-zinc-500 font-mono">
                {history.length} {history.length === 1 ? 'note' : 'notes'}
              </span>
            </div>

            {history.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                No previous notes recorded for this project yet.
              </div>
            ) : (
              <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
                {history.map((item) => {
                  const isSelected = item.noteDate === selectedDate;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleDateChange(item.noteDate)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/40'
                          : 'hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                        <span className="truncate">{formatDisplayDate(item.noteDate)}</span>
                      </div>
                      {item.noteDate === todayStr && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-500/20 text-blue-400 shrink-0">
                          Today
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

