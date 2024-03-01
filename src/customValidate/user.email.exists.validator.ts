import { BadRequestException, Injectable } from '@nestjs/common';

import {
  //ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UsersQueryRepository } from 'src/users/users.queryRepository';

@ValidatorConstraint({ name: 'UserEmailExists', async: true })
@Injectable()
export class UserEmailExistsValidator implements ValidatorConstraintInterface {
  constructor(private readonly userQueryRepository: UsersQueryRepository) {}
  async validate(email: string) {
    console.log(email);
    try {
      const user = await this.userQueryRepository.findUserByEmail(email);
      if (user) {
        console.log(user);
        throw new BadRequestException([
          {
            message: 'this email found in base',
            field: 'email',
          },
        ]);
      } else {
        return true;
      } // Вернуть true, если пользователь не найден
    } catch (e) {
      return false;
    }
  }

  //   defaultMessage(args: ValidationArguments) {
  //     const fieldName = args.property;
  //     return `This login already exists: ${fieldName}`;
  //   }
}
