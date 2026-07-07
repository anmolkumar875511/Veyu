// src/constants/categoryIcons.js
// Maps complaint categories to Lucide icon components (replaces emoji icons).

import {
    Construction,
    AlertTriangle,
    Trash2,
    Droplets,
    Waves,
    Lightbulb,
    Wrench,
    TrafficCone,
    Recycle,
    ClipboardList,
} from 'lucide-react';

export const CATEGORY_ICON_MAP = {
    'Road Damage': Construction,
    Pothole: AlertTriangle,
    Garbage: Trash2,
    'Water Leakage': Droplets,
    Drainage: Waves,
    Streetlight: Lightbulb,
    Sewage: Wrench,
    Encroachment: TrafficCone,
    'Illegal Dumping': Recycle,
    Other: ClipboardList,
};

export function getCategoryIcon(category) {
    return CATEGORY_ICON_MAP[category] ?? ClipboardList;
}
