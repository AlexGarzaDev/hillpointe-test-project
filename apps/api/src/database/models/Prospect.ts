import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey } from 'sequelize';
import sequelize from '../sequelize';
import UnitModel from './Unit';

export class ProspectModel extends Model<InferAttributes<ProspectModel>, InferCreationAttributes<ProspectModel>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare email: string;
  declare phone?: string | null;
  declare status: string;
  declare assignedUnitId?: ForeignKey<UnitModel['id']> | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ProspectModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('new', 'contacted', 'tour_scheduled', 'toured', 'application', 'leased', 'lost'),
      allowNull: false,
      defaultValue: 'new',
    },
    assignedUnitId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: UnitModel,
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Prospect',
    tableName: 'prospects',
    timestamps: true,
  }
);

ProspectModel.belongsTo(UnitModel, { foreignKey: 'assignedUnitId', as: 'unit' });
UnitModel.hasMany(ProspectModel, { foreignKey: 'assignedUnitId', as: 'prospects' });

export default ProspectModel;
