import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../sequelize';

// Unit table stores inventory that prospects can be assigned to and tours can target.
export class UnitModel extends Model<InferAttributes<UnitModel>, InferCreationAttributes<UnitModel>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare status: 'available' | 'held' | 'leased';
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

UnitModel.init(
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
    status: {
      type: DataTypes.ENUM('available', 'held', 'leased'),
      allowNull: false,
      defaultValue: 'available',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    // Model/table names are explicitly pinned to avoid naming surprises across envs.
    modelName: 'Unit',
    tableName: 'units',
    timestamps: true,
  }
);

export default UnitModel;
