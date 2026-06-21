export type AiPredictionTab = 'dropout' | 'fee-default' | 'attendance';

export const AI_PREDICTION_TABS: { id: AiPredictionTab; label: string }[] = [
  { id: 'dropout', label: 'Dropout Risk' },
  { id: 'fee-default', label: 'Fee Default' },
  { id: 'attendance', label: 'Attendance Risk' },
];
