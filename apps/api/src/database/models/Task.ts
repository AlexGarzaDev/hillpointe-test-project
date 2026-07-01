import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey } from 'sequelize';
import sequelize from '../sequelize';
import ProspectModel from './Prospect';

// Tasks capture operational follow-ups generated manually or by pipeline rules.
export class TaskModel extends Model<InferAttributes<TaskModel>, InferCreationAttributes<TaskModel>> {
  declare id: CreationOptional<string>;
  declare prospectId: ForeignKey<ProspectModel['id']>;
  declare title: string;
  declare state: 'open' | 'done';
  declare dueDate: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

TaskModel.init(
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
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'due_date',
    },
    state: {
      type: DataTypes.ENUM('open', 'done'),
      allowNull: false,
      defaultValue: 'open',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    timestamps: true,
  }
);

TaskModel.belongsTo(ProspectModel, { foreignKey: 'prospectId', as: 'prospect' });
// Deleting a prospect cascades task removal to avoid orphan records.
ProspectModel.hasMany(TaskModel, { foreignKey: 'prospectId', as: 'tasks' });

export default TaskModel;
