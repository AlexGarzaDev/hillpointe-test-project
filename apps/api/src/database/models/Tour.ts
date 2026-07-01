import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey } from 'sequelize';
import sequelize from '../sequelize';
import ProspectModel from './Prospect';
import UnitModel from './Unit';

// Tours represent scheduled visits linking a prospect to a specific unit/time.
export class TourModel extends Model<InferAttributes<TourModel>, InferCreationAttributes<TourModel>> {
  declare id: CreationOptional<string>;
  declare prospectId: ForeignKey<ProspectModel['id']>;
  declare unitId: ForeignKey<UnitModel['id']>;
  declare scheduledTime: string;
  declare outcome?: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

TourModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    prospectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: ProspectModel,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    unitId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: UnitModel,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    scheduledTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    outcome: {
      type: DataTypes.ENUM('completed', 'no_show', 'cancelled'),
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Tour',
    tableName: 'tours',
    timestamps: true,
  }
);

TourModel.belongsTo(ProspectModel, { foreignKey: 'prospectId', as: 'prospect' });
TourModel.belongsTo(UnitModel, { foreignKey: 'unitId', as: 'unit' });
// Reverse links allow querying tours from either prospect or unit perspectives.
ProspectModel.hasMany(TourModel, { foreignKey: 'prospectId', as: 'tours' });
UnitModel.hasMany(TourModel, { foreignKey: 'unitId', as: 'tours' });

export default TourModel;
