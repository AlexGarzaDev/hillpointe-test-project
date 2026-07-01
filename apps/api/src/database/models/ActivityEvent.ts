import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey } from 'sequelize';
import sequelize from '../sequelize';
import ProspectModel from './Prospect';

export class ActivityEventModel extends Model<InferAttributes<ActivityEventModel>, InferCreationAttributes<ActivityEventModel>> {
  declare id: CreationOptional<string>;
  declare prospectId?: ForeignKey<ProspectModel['id']> | null;
  declare eventType: string;
  declare description?: string | null;
  declare previousStatus?: string | null;
  declare newStatus?: string | null;
  declare createdAt: CreationOptional<Date>;
}

ActivityEventModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    prospectId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: ProspectModel,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    eventType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    previousStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    newStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'ActivityEvent',
    tableName: 'activity_events',
    timestamps: false,
    createdAt: 'created_at',
  }
);

ActivityEventModel.belongsTo(ProspectModel, { foreignKey: 'prospectId', as: 'prospect' });
ProspectModel.hasMany(ActivityEventModel, { foreignKey: 'prospectId', as: 'activities' });

export default ActivityEventModel;
