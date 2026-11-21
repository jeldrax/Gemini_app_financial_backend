// crear un objeto lo mas apegado a lo que yo quiero recivitr por el POST posman
// El prompt lo deve recibir "basic-prompt"
// Lo validamos y lo retornamos para mandarselo al servicio(dto)
// Luego el Dto se lo manda ala accion que queremos ejecutar en gemini

import { IsNotEmpty, IsString, isString } from "class-validator";

export class BasicPromptDto{

    @IsString()
    @IsNotEmpty()
    
    prompt: string;

}