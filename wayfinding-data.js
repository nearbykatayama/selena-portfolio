/* Pontos de apresentação referenciados à planta fornecida. Sem geolocalização real. */
(() => {
  const shared=[[369,1309],[340,1309],[333,1168],[226,1168],[226,1290],[108,1290]];
  window.SelenaMapData={
    width:433,height:1496,address:'Unidade demonstrativa · Londrina',
    image:'assets/planta-londrina-fonte-000.png',
    routes:{
      massage:{
        title:'Sala de massoterapia',short:'Massoterapia',focus:[205,1260,360],
        points:[...shared,[108,1214],[76,1214]],
        steps:[
          'Vamos começar pela recepção. Esta é uma demonstração de percurso até a massoterapia.',
          'Siga pelo corredor ao lado da sala de reunião.',
          'Contorne a sala de reunião pelo corredor indicado na planta.',
          'Continue pelo corredor entre as estações de trabalho e o RH.',
          'Vire à esquerda, seguindo pelo corredor transversal.',
          'Agora siga em direção à sala de massoterapia.',
          'Chegamos à sala de massoterapia. Antes do uso real, esse trajeto deve ser validado no local.'
        ]
      },
      health:{
        title:'Espaço Saúde',short:'Espaço Saúde',focus:[205,1355,330],
        points:[...shared,[108,1380],[76,1380]],
        steps:[
          'Vamos começar pela recepção. Esta é uma demonstração de percurso até o Espaço Saúde.',
          'Siga pelo corredor ao lado da sala de reunião.',
          'Contorne a sala de reunião pelo corredor indicado na planta.',
          'Continue pelo corredor entre as estações de trabalho e o RH.',
          'Vire à esquerda no corredor transversal.',
          'Siga em direção ao Espaço Saúde, na lateral esquerda da planta.',
          'Chegamos ao Espaço Saúde. Antes do uso real, esse trajeto deve ser validado no local.'
        ]
      }
    },
    rooms:[
      {id:'massage',x:51,y:1197,w:45,h:35,label:'Massoterapia',color:'#70b992'},
      {id:'bathroom',x:51,y:1234,w:45,h:38,label:'Banheiro',color:'#d38db3'},
      {id:'health',x:50,y:1353,w:44,h:70,label:'Espaço Saúde',color:'#aa82c9'},
      {id:'hr',x:234,y:1280,w:70,h:145,label:'RH',color:'#eeb66f'}
    ]
  };
})();
