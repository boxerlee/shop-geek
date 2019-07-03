var express=require('express');
var router=express.Router();
var Category=require('../../models/category');
var Product=require('../../models/product');
const AWS= require('aws-sdk');

//GET edit product

router.get('/:id',(req,res)=>{
  Product.findById({_id:req.params.id},(err,product)=>{
    if(err){
      console.log(err);
    }else{
      var s3=new AWS.S3();
      var myKey=product._id+'/'+product.image;
      var URL=s3.getSignedUrl('getObject',{
          Bucket:process.env.BUCKET,
          Key:`${myKey}`,
          Expires: 1000
      });
      res.send({
        product:product,
        URL:URL
      });
    }
  });
});

//POST edit product
router.post('/:id',(req,res)=>{

  var id=req.params.id;
  var title=req.body.title;
  var slug=title.replace(/\s+/g,'-').toLowerCase();
  var description=req.body.description;
  var price=req.body.price;
  var category=req.body.category;
  var imageFile;

  //so that expressValidator does not throw error
  if(req.files!=null){
    imageFile=req.files.image.name;
    req.checkBody('image','Uploaded file is not an image').isImage(imageFile);
  }else if(req.files==null){
    imageFile='';
  }

  var errors=req.validationErrors();
  
  if(errors){
    res.send({
      errors:errors,
      title:title,
      description:description,
      price:price,
      category:category
    });
  }else{
    
    Product.findOne({slug:slug,_id:{'$ne':id}},(err,prd)=>{
      if(prd){
        res.send({
          title:title,
          description:description,
          price:price,
          category:category,
          errors:'Product already exists, please choose another'
        });
      }
      else{
        Product.findById(id,(err,product)=>{
          if(err){
            console.log(err);
          }
          else{
            var priceFlt=parseFloat(price).toFixed(2);

            product.title=title;
            product.slug=slug;
            product.description=description;
            product.category=category;
            product.price=priceFlt;
            if(imageFile!=''){
              product.image=imageFile;
            }

            product.save(err=>{
              if(err){
                console.log(err);
              }
              else{
                if(imageFile!=''){
                  var productImage=req.files.image.data;
                  var s3 = new AWS.S3();
    
                  var myKey=product._id+'/'+product.image;
    
                  var params = {
                    Bucket: process.env.BUCKET,
                    Body : productImage,
                    Key : `${myKey}`
                  };
    
                  s3.upload(params,(err,data)=>{
                    if(err){
                      console.log(err);
                    }
                    if(data){
                      res.send({
                        success:'Product edited successfully!!'
                      });
                    }
                  });
                }
              }
            });
          }
        });
      }
    });
  }
});

//Exports
module.exports=router;