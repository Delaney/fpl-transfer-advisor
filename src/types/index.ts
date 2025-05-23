export interface Main {
    teams: PLTeam[];
    element_types: Position[];
    elements: Player[];
    events: Event[];
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
    minutes: number;
    team_code: number;
    chance_of_playing_next_round: number;
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
    transfers: {
        bank: number;
        limit: number;
    };
    bank?: number;
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

export interface Event {
    id: number;
    name: string;
    deadline_time_epoch: number;
    most_transferred_in: number;
}

export interface Fixture {
    code: number;
    event: number;
    team_a: number;
    team_h: number;
    team_h_difficulty: number;
    team_a_difficulty: number;
}

export interface TopRecommendation {
    name: string;
    position: string;
    form: string;
    price: string;
    nextFixtureDifficulty: string;
}
