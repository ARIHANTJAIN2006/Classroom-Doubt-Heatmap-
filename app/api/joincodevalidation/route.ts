import {NextRequest,NextResponse} from 'next/server'
import {prisma} from '@/lib/prisma'
export async function POST(req: NextRequest){
try{
const {joincode} = await req.json()

const isvalid = await prisma.lecture.findUnique({
    where:
    {
        joinCode:joincode
    }
})
if(isvalid){
    return NextResponse.json({valid:true})
}else{
    return NextResponse.json({valid:false})
}
}catch(error){
    console.error(error)
    return NextResponse.json({error:'Internal Server Error'},{status:500})
}
}