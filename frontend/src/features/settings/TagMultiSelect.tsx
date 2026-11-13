import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TagMultiSelectProps {
  label: string;
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  isEditing?: boolean;
  helperText?: string;
}

export const TagMultiSelect: React.FC<TagMultiSelectProps> = ({
  label,
  selectedTags,
  onChange,
  suggestions = [],
  placeholder = 'Type and press Enter or click +',
  isEditing = true,
  helperText,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = (rawTag: string) => {
    const trimmed = rawTag.trim();
    if (!trimmed) return;
    // Prevent duplicates (case-insensitive)
    const exists = selectedTags.some((t) => t.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      onChange([...selectedTags, trimmed]);
    }
    setInputValue('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(selectedTags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  const toggleSuggestion = (suggestion: string) => {
    const exists = selectedTags.some((t) => t.toLowerCase() === suggestion.toLowerCase());
    if (exists) {
      onChange(selectedTags.filter((t) => t.toLowerCase() !== suggestion.toLowerCase()));
    } else {
      onChange([...selectedTags, suggestion]);
    }
  };

  // View Mode: readable badges
  if (!isEditing) {
    return (
      <div className="space-y-1.5 text-left">
        <span className="block text-xs font-medium text-zinc-300">{label}</span>
        {selectedTags.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">None selected</p>
        ) : (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Edit Mode: interactive tag manager
  return (
    <div className="space-y-2 text-left">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-zinc-300">{label}</label>
        <span className="text-[11px] text-zinc-500 font-mono">
          {selectedTags.length} selected
        </span>
      </div>

      {/* Selected tags container with input */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border border-zinc-700/80 bg-zinc-900/90 min-h-[42px] focus-within:ring-2 focus-within:ring-blue-500/80 focus-within:border-blue-500/80 transition-colors">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="text-blue-400 hover:text-red-400 hover:bg-red-500/10 rounded p-0.5 transition-colors"
              title={`Remove ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <div className="flex-1 min-w-[140px] flex items-center gap-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTags.length === 0 ? placeholder : 'Add more...'}
            className="w-full bg-transparent border-none text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none py-1"
          />
          {inputValue.trim() && (
            <button
              type="button"
              onClick={() => handleAddTag(inputValue)}
              className="p-1 rounded bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 text-xs transition-colors shrink-0"
              title="Add item"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Helper text */}
      {helperText && <p className="text-[11px] text-zinc-400">{helperText}</p>}

      {/* Suggestions Chips */}
      {suggestions.length > 0 && (
        <div className="space-y-1 pt-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Quick Add:</span>
          <div className="flex flex-wrap gap-1">
            {suggestions.map((sug) => {
              const isSelected = selectedTags.some((t) => t.toLowerCase() === sug.toLowerCase());
              return (
                <button
                  key={sug}
                  type="button"
                  onClick={() => toggleSuggestion(sug)}
                  className={cn(
                    'text-[11px] px-2 py-0.5 rounded-md border font-mono transition-all',
                    isSelected
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-zinc-800/60 text-zinc-400 border-zinc-750 hover:bg-zinc-800 hover:text-zinc-200'
                  )}
                >
                  {isSelected ? `✓ ${sug}` : `+ ${sug}`}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
