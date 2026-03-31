export class FicheService {
  id: string;
  fiche_id: string;
  service_id: string;
  operator_id: string;
  start_time: Date;
  end_time: Date;
  duration: number;

  constructor(ficheService: FicheService) {
    this.id = ficheService.id;
    this.fiche_id = ficheService.fiche_id;
    this.service_id = ficheService.service_id;
    this.operator_id = ficheService.operator_id;
    this.start_time = ficheService.start_time;
    this.end_time = ficheService.end_time;
    this.duration = ficheService.duration;
  }

  getDuration(): number {
    return Math.floor((new Date(this.end_time).getTime() - new Date(this.start_time).getTime()) / 60000);
  }
}
