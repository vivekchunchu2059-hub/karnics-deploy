import React from 'react';
import { Box, Typography } from '@mui/material';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';

export interface EmptyStateProps {
  /** Short title (e.g. "No data yet") */
  title?: string;
  /** Main message shown below the icon */
  message: string;
  /** Optional subtitle or hint */
  subtitle?: string;
  /** Optional custom icon; default is folder open */
  icon?: React.ReactNode;
  /** Minimum height of the block so it looks like a card */
  minHeight?: number;
}

const DEFAULT_TITLE = 'No data yet';

const EmptyState: React.FC<EmptyStateProps> = ({
  title = DEFAULT_TITLE,
  message,
  subtitle,
  icon,
  minHeight = 280,
}) => {
  const Icon = icon ?? (
    <FolderOpenOutlinedIcon
      sx={{
        fontSize: 64,
        color: 'rgba(0, 0, 0, 0.12)',
      }}
    />
  );

  return (
    <Box
      sx={{
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        border: '1px dashed rgba(0, 0, 0, 0.08)',
      }}
    >
      <Box sx={{ mb: 2 }}>{Icon}</Box>
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 600,
          color: '#374151',
          fontSize: '16px',
          textAlign: 'center',
          mb: 0.5,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: '#6b7280',
          fontSize: '14px',
          textAlign: 'center',
          maxWidth: 360,
        }}
      >
        {message}
      </Typography>
      {subtitle && (
        <Typography
          variant="caption"
          sx={{
            color: '#9ca3af',
            fontSize: '12px',
            textAlign: 'center',
            mt: 1,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default EmptyState;
