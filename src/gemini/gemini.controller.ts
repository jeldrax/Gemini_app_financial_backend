import { Body, Controller, Get, Post } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { BasicPromptDto } from '../dtos/basic-prompt.dto';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  //enpoitnt para probar el servicio(es el endpoint que se va a llamar desde el front)es el basico
  @Post('basic-prompt')
  //en la peticion post extraiga el contenido -> lo pasa al Body y se pasara a conocer/llamar = body de tipo BasicPromptDto
  basicPrompt( @Body() basicPromptDto: BasicPromptDto ) {
    return this.geminiService.basicPrompt(basicPromptDto);
  }
}
