export interface Main {
    teams: PLTeam[];
    element_types: Position[];
    elements: Player[];
}

export interface Player {
    id: number;
    web_name: string;
    element_type: number;
    team: number;
    now_cost: number;
    total_points: number;
    selected_by_percent: string;
    form: string;
    status: string;
    expected_goals_conceded: string;
}

export interface Position {
    id: number;
    plural_name: string;
    plural_name_short: string;
    singular_name: string;
    singular_name_short: string;
    squad_select: number;
    squad_min_play: number;
    squad_max_play: number;
}

export interface FPLTeam {
    picks: {
        element: number,
        element_type: number;
        name?: string;
    }[];
    transfers: { bank: number };
}

export interface PLTeam {
    code: number;
    draw: number;
    form: null;
    id: number;
    loss: number;
    name: string;
    played: number;
    points: number;
    position: number;
    short_name: string;
    strength: number;
    unavailable: boolean;
    win: number;
    strength_overall_home: number;
    strength_overall_away: number;
    strength_attack_home: number;
    strength_attack_away: number;
    strength_defence_home: number;
    strength_defence_away: number;
    pulse_id: number;
}

export interface TransferSuggestion {
    out: string;
    in: string;
    cost: number;
}