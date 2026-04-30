export class FicheService {
  id: string;
  salon_id: string;
  fiche_id: string;
  service_id: string;
  name: string;
  operator_id: string;
  start_time: Date;
  end_time: Date;
  duration: number;
  list_price: number;
  final_price: number;
  abbonamento_id: string | null;

  constructor(ficheService: FicheService) {
    this.id = ficheService.id;
    this.salon_id = ficheService.salon_id;
    this.fiche_id = ficheService.fiche_id;
    this.service_id = ficheService.service_id;
    this.name = ficheService.name ?? '';
    this.operator_id = ficheService.operator_id;
    this.start_time = ficheService.start_time;
    this.end_time = ficheService.end_time;
    this.duration = ficheService.duration;
    this.list_price = ficheService.list_price ?? 0;
    this.final_price = ficheService.final_price ?? 0;
    this.abbonamento_id = ficheService.abbonamento_id ?? null;
  }

  getDuration(): number {
    return Math.floor((new Date(this.end_time).getTime() - new Date(this.start_time).getTime()) / 60000);
  }
}
