import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import { mergeAttributes } from '@tiptap/core';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Link as LinkIcon,
  Minus,
  Undo,
  Redo,
  AtSign,
  Clock,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import type { Task, WorkSession } from '../../types';

export interface MentionItem {
  id: string;
  type: 'task' | 'session';
  label: string;
  date?: string;
  status?: string;
  priority?: string;
}

interface DailyNoteEditorProps {
  content: string;
  onChange: (content: string) => void;
  tasks?: Task[];
  sessions?: WorkSession[];
  onSelectTask?: (taskId: string) => void;
  onSelectSession?: (sessionId: string) => void;
  placeholder?: string;
}

// Custom Mention Extension extending TipTap's Mention
const CustomMention = Mention.extend({
  name: 'mention',
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-id'),
        renderHTML: (attributes) => ({
          'data-id': attributes.id,
        }),
      },
      type: {
        default: 'task',
        parseHTML: (element) => element.getAttribute('data-mention-type') || 'task',
        renderHTML: (attributes) => ({
          'data-mention-type': attributes.type,
        }),
      },
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-label'),
        renderHTML: (attributes) => ({
          'data-label': attributes.label,
        }),
      },
      date: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-date'),
        renderHTML: (attributes) => ({
          'data-date': attributes.date,
        }),
      },
      status: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-status'),
        renderHTML: (attributes) => ({
          'data-status': attributes.status,
        }),
      },
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    const isTask = node.attrs.type === 'task';
    const dateText = node.attrs.date ? ` · ${node.attrs.date}` : '';
    return [
      'span',
      mergeAttributes(
        {
          'data-type': 'mention',
          'data-mention-type': node.attrs.type,
          'data-id': node.attrs.id,
          'data-label': node.attrs.label,
          'data-date': node.attrs.date,
          'data-status': node.attrs.status,
          class: `mention-badge inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold cursor-pointer select-none transition-all ${
            isTask
              ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30'
              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
          }`,
        },
        HTMLAttributes
      ),
      `@${node.attrs.label || 'item'}${dateText}`,
    ];
  },
});

export function DailyNoteEditor({
  content,
  onChange,
  tasks = [],
  sessions = [],
  onSelectTask,
  onSelectSession,
}: DailyNoteEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [suggestionState, setSuggestionState] = useState<{
    isOpen: boolean;
    query: string;
    items: MentionItem[];
    selectedIndex: number;
    rect: DOMRect | null;
    command: (item: MentionItem) => void;
  } | null>(null);

  // Build searchable items pool from existing project tasks and work sessions
  const taskItems: MentionItem[] = tasks.map((t) => ({
    id: t.id,
    type: 'task',
    label: t.title,
    status: t.status,
    priority: t.priority,
  }));

  const sessionItems: MentionItem[] = sessions.map((s) => ({
    id: s.id,
    type: 'session',
    label: s.title,
    date: formatDate(s.startedAt),
    status: s.status,
  }));

  const allMentionPoolRef = useRef<MentionItem[]>([]);
  allMentionPoolRef.current = [...taskItems, ...sessionItems];

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-outside ml-5 space-y-1 my-2',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal list-outside ml-5 space-y-1 my-2',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-blue-500/60 pl-3 my-2 italic text-zinc-300 bg-zinc-850/30 py-1 rounded-r',
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'rounded-lg bg-zinc-950 border border-zinc-800 p-3 my-2 font-mono text-xs text-blue-300 overflow-x-auto',
          },
        },
        horizontalRule: {
          HTMLAttributes: {
            class: 'my-4 border-t border-zinc-800',
          },
        },
      }),
      Underline,
      TaskList.configure({
        HTMLAttributes: {
          class: 'space-y-1.5 my-2',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start gap-2 text-sm',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-400 underline underline-offset-2 hover:text-blue-300 cursor-pointer',
        },
      }),
      CustomMention.configure({
        HTMLAttributes: {
          class: 'mention-badge',
        },
        suggestion: {
          items: ({ query }) => {
            const cleanQuery = query.toLowerCase().trim();
            const pool = allMentionPoolRef.current;
            if (!cleanQuery) return pool.slice(0, 15);
            return pool
              .filter(
                (item) =>
                  item.label.toLowerCase().includes(cleanQuery) ||
                  (item.date && item.date.toLowerCase().includes(cleanQuery))
              )
              .slice(0, 15);
          },
          render: () => {
            return {
              onStart: (props) => {
                const rect = props.clientRect ? props.clientRect() : null;
                setSuggestionState({
                  isOpen: true,
                  query: props.query,
                  items: props.items as MentionItem[],
                  selectedIndex: 0,
                  rect,
                  command: (item: MentionItem) => {
                    props.command({
                      id: item.id,
                      type: item.type,
                      label: item.label,
                      date: item.date,
                      status: item.status,
                    });
                  },
                });
              },
              onUpdate: (props) => {
                const rect = props.clientRect ? props.clientRect() : null;
                setSuggestionState((prev) =>
                  prev
                    ? {
                        ...prev,
                        query: props.query,
                        items: props.items as MentionItem[],
                        selectedIndex: 0,
                        rect,
                      }
                    : null
                );
              },
              onKeyDown: (props) => {
                if (!suggestionState || !suggestionState.items.length) return false;
                if (props.event.key === 'ArrowDown') {
                  setSuggestionState((prev) =>
                    prev
                      ? {
                          ...prev,
                          selectedIndex: (prev.selectedIndex + 1) % prev.items.length,
                        }
                      : null
                  );
                  return true;
                }
                if (props.event.key === 'ArrowUp') {
                  setSuggestionState((prev) =>
                    prev
                      ? {
                          ...prev,
                          selectedIndex:
                            (prev.selectedIndex + prev.items.length - 1) % prev.items.length,
                        }
                      : null
                  );
                  return true;
                }
                if (props.event.key === 'Enter') {
                  const selected = suggestionState.items[suggestionState.selectedIndex];
                  if (selected) {
                    suggestionState.command(selected);
                    setSuggestionState(null);
                    return true;
                  }
                }
                if (props.event.key === 'Escape') {
                  setSuggestionState(null);
                  return true;
                }
                return false;
              },
              onExit: () => {
                setSuggestionState(null);
              },
            };
          },
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'min-h-[360px] p-4 text-zinc-100 text-sm leading-relaxed focus:outline-none focus:ring-0',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Synchronize incoming content changes when switching dates or notes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  // Handle clicking on mention badges inside the editor
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('[data-mention-type]');
    if (target) {
      e.preventDefault();
      e.stopPropagation();
      const mentionType = target.getAttribute('data-mention-type');
      const mentionId = target.getAttribute('data-id');

      if (mentionType === 'task' && mentionId && onSelectTask) {
        onSelectTask(mentionId);
      } else if (mentionType === 'session' && mentionId && onSelectSession) {
        onSelectSession(mentionId);
      }
    }
  };

  if (!editor) {
    return (
      <div className="h-[360px] flex items-center justify-center text-xs text-zinc-500">
        Loading editor...
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter link URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const tasksGroup = suggestionState?.items.filter((i) => i.type === 'task') || [];
  const sessionsGroup = suggestionState?.items.filter((i) => i.type === 'session') || [];

  return (
    <div
      ref={editorRef}
      onClick={handleEditorClick}
      className="rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-xs overflow-hidden flex flex-col relative"
    >
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-900 border-b border-zinc-800/80 text-zinc-300">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-zinc-800 mx-1" />

        {/* Text Marks */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('bold') ? 'bg-zinc-800 text-blue-400' : 'hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('italic') ? 'bg-zinc-800 text-blue-400' : 'hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('underline') ? 'bg-zinc-800 text-blue-400' : 'hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('strike') ? 'bg-zinc-800 text-blue-400' : 'hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-zinc-800 mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-zinc-800 text-blue-400'
              : 'hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-zinc-800 text-blue-400'
              : 'hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-zinc-800 text-blue-400'
              : 'hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-zinc-800 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-zinc-800 text-blue-400'
              : 'hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-zinc-800 text-blue-400'
              : 'hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="Checklist"
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('taskList')
              ? 'bg-zinc-800 text-blue-400'
              : 'hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-zinc-800 mx-1" />

        {/* Blockquote & Code */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-zinc-800 text-blue-400'
              : 'hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('codeBlock')
              ? 'bg-zinc-800 text-blue-400'
              : 'hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <Code className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-zinc-800 mx-1" />

        {/* Link & Divider */}
        <button
          type="button"
          onClick={setLink}
          title="Insert Hyperlink"
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('link') ? 'bg-zinc-800 text-blue-400' : 'hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Divider"
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Mention helper button */}
        <button
          type="button"
          onClick={() => editor.chain().focus().insertContent('@').run()}
          title="Mention task or work session (Type @)"
          className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-750 text-xs font-medium text-blue-400 transition-colors"
        >
          <AtSign className="w-3.5 h-3.5" />
          <span>Mention</span>
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 bg-zinc-950/40 cursor-text">
        <EditorContent editor={editor} />
      </div>

      {/* Mention Suggestion Popup */}
      {suggestionState && suggestionState.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: suggestionState.rect ? suggestionState.rect.bottom + 6 : 100,
            left: suggestionState.rect
              ? Math.max(10, Math.min(suggestionState.rect.left, window.innerWidth - 340))
              : 100,
            zIndex: 9999,
          }}
          className="w-80 max-h-72 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl p-1.5 text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2 py-1.5 border-b border-zinc-800/80 text-[11px] font-semibold text-zinc-400 flex items-center justify-between">
            <span>Reference Project Items</span>
            <span className="text-[10px] text-zinc-500 font-mono">↑↓ Navigate · ↵ Select</span>
          </div>

          {suggestionState.items.length === 0 ? (
            <div className="p-3 text-center text-zinc-500 text-xs">
              No matching tasks or work sessions found
            </div>
          ) : (
            <div className="py-1 space-y-2">
              {/* Tasks Section */}
              {tasksGroup.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <CheckSquare className="w-3 h-3" />
                    <span>Tasks ({tasksGroup.length})</span>
                  </div>
                  <div className="space-y-0.5">
                    {tasksGroup.map((item) => {
                      const overallIndex = suggestionState.items.indexOf(item);
                      const isSelected = overallIndex === suggestionState.selectedIndex;
                      return (
                        <div
                          key={`task-${item.id}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            suggestionState.command(item);
                            setSuggestionState(null);
                          }}
                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-600/20 text-white border border-blue-500/40'
                              : 'hover:bg-zinc-800/80 text-zinc-300'
                          }`}
                        >
                          <div className="truncate min-w-0 font-medium">
                            {item.label}
                          </div>
                          {item.status && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                              {item.status}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Work Sessions Section */}
              {sessionsGroup.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>Work Sessions ({sessionsGroup.length})</span>
                  </div>
                  <div className="space-y-0.5">
                    {sessionsGroup.map((item) => {
                      const overallIndex = suggestionState.items.indexOf(item);
                      const isSelected = overallIndex === suggestionState.selectedIndex;
                      return (
                        <div
                          key={`session-${item.id}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            suggestionState.command(item);
                            setSuggestionState(null);
                          }}
                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-600/20 text-white border border-emerald-500/40'
                              : 'hover:bg-zinc-800/80 text-zinc-300'
                          }`}
                        >
                          <div className="truncate min-w-0 font-medium">
                            {item.label}
                          </div>
                          {item.date && (
                            <span className="text-[10px] text-zinc-400 shrink-0">
                              {item.date}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
