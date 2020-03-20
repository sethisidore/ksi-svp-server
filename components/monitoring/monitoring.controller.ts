import { Response, Request } from "express";
import { BallotBox } from "../voting/ballot.model";

export class MonitoringController {
  async fetchAndCollateToNationals (req: Request, res: Response) {
    const elections = await BallotBox.find({ statusOpen: true, tier: 'FED' }).exec();
    return res.json({message: 'Welcome to National Monitoring'});
  }

  async fetchAndCollateToPoliticalZones (req: Request, res: Response) {
    const elections = await BallotBox.find({ statusOpen: true, tier: 'SEN' }).exec();
    elections.forEach(async (item) => {
      await item.populate('votes').execPopulate();
    });
    return res.json({message: 'Welcome to Zonal Monitoring', elections });
  }

  async fetchAndCollateToStates (req: Request, res: Response) {
    const elections = await BallotBox.find({ statusOpen: true, tier: 'GOV' }).exec();
    elections.forEach(async (item) => {
      await item.populate('votes').execPopulate();
    });
    return res.json({message: 'Welcome to States Monitoring'});
  }

  async fetchAndCollateToLG (req: Request, res:Response) {
    const elections = await BallotBox.find({ statusOpen: true, tier: 'LG' }).exec();
    elections.forEach(async (item) => {
      await item.populate('votes').execPopulate();
    });
    return res.json({message: 'Welcome to LG Monitoring'});
  }
}
